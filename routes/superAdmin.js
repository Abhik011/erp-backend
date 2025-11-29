const express = require("express");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");
const { sendAdminEmail  } = require("../utils/adminsmpt"); 
const { superAdminOTPTemplate } = require("../utils/emailTemplates");

const router = express.Router();

// ============================================================
// DEV COOKIE (works for localhost + 192.168.x.x + kzarre.local)
// ============================================================
const DEV_COOKIE = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ============================================================
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const pendingSuperAdmins = {};

// ============================================================
// 1️⃣ Register (Send OTP)
// ============================================================
router.post("/register", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email)
      return res.status(400).json({ message: "Name & email required" });

    const exists = await SuperAdmin.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "SuperAdmin already exists" });

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    pendingSuperAdmins[email] = { name, otp, otpExpires };

    await sendAdminEmail(
      email,
      "SuperAdmin Registration OTP",
      superAdminOTPTemplate(name, otp, "register")
    );

    res.json({ success: true, message: "OTP sent", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 2️⃣ Verify Register OTP
// ============================================================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pending = pendingSuperAdmins[email];
    if (!pending)
      return res.status(400).json({ message: "No OTP request found" });

    if (pending.otp !== otp || Date.now() > pending.otpExpires)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const superAdmin = new SuperAdmin({
      name: pending.name,
      email,
      isVerified: true,
    });

    await superAdmin.save();
    delete pendingSuperAdmins[email];

    const token = jwt.sign(
      { id: superAdmin._id, role: "superadmin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, message: "Registration complete", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 3️⃣ Login (Send OTP)
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email, isVerified: true });
    if (!superAdmin)
      return res.status(404).json({ message: "Account not found" });

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    pendingSuperAdmins[email] = { otp, otpExpires };

    await sendAdminEmail(
      email,
      "SuperAdmin Login OTP",
      superAdminOTPTemplate(superAdmin.name, otp, "login")
    );

    res.json({ success: true, message: "OTP sent", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 4️⃣ Verify Login OTP → Set Cookie + Tokens
// ============================================================
router.post("/login/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email });
    const pending = pendingSuperAdmins[email];

    if (!superAdmin || !pending || pending.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > pending.otpExpires)
      return res.status(400).json({ message: "OTP expired" });

    delete pendingSuperAdmins[email];

    const payload = { id: superAdmin._id, role: "superadmin" };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Save session ⬇
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    superAdmin.currentSession = {
      token: refreshToken,
      ip,
      userAgent,
      loginAt: new Date(),
    };

    await superAdmin.save();

    // Set cookie (dev-safe)
    res.cookie("refresh_token", refreshToken, DEV_COOKIE);

    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 5️⃣ Refresh Access Token
// ============================================================
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (!token)
      return res.status(401).json({ message: "No refresh token found" });

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const superAdmin = await SuperAdmin.findById(payload.id);
    if (!superAdmin)
      return res.status(401).json({ message: "User not found" });

    // ----------------------------------------------------------
    // 🚀 FIXED: Disable IP checking in DEV environment
    // ----------------------------------------------------------
    if (process.env.NODE_ENV === "production") {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      const savedIp = (superAdmin.currentSession?.ip || "").replace("::ffff:", "");
      const currentIp = ip.replace("::ffff:", "");

      if (savedIp !== currentIp)
        return res.status(401).json({ message: "Session mismatch" });
    }

// Create new access token
const newAccessToken = jwt.sign(
  { id: superAdmin._id, role: "superadmin" },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);

// Create NEW refresh token
const newRefreshToken = jwt.sign(
  { id: superAdmin._id, role: "superadmin" },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: "7d" }
);

// Update session
superAdmin.currentSession.token = newRefreshToken;
await superAdmin.save();

// Set cookie again
res.cookie("refresh_token", newRefreshToken, DEV_COOKIE);

// Send both tokens
res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// ============================================================
// 6️⃣ Logout
// ============================================================
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    res.clearCookie("refresh_token");
    res.json({ message: "Logged out" });
  }
});

module.exports = router;
