const jwt = require("jsonwebtoken");
const User = require("../models/Customer");

// ================================================
// ✅ HYBRID AUTH MIDDLEWARE (COOKIE + HEADER)
// ================================================
const auth = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return async (req, res, next) => {
    try {
      let token = null;

      // ✅ 1️⃣ FIRST TRY: COOKIE (FOR NEXT.JS MIDDLEWARE)
      if (req.cookies && req.cookies.kzarre_token) {
        token = req.cookies.kzarre_token;
      }

      // ✅ 2️⃣ FALLBACK: AUTHORIZATION HEADER (OLD SYSTEM)
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("JWT Auth Error:", err.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

// ================================================
// ✅ LOGIN CONTROLLER (NOW SETS COOKIE)
// ================================================
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastLoginIP = userIP;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ ✅ ✅ SET SECURE HTTP-ONLY COOKIE (FOR NEXT.JS MIDDLEWARE)
    res.cookie("kzarre_token", token, {
      httpOnly: true, // ✅ JS CANNOT ACCESS
      secure: process.env.NODE_ENV === "production", // ✅ HTTPS only in production
      sameSite: "lax", // ✅ Works with Next.js
      path: "/", // ✅ REQUIRED FOR MIDDLEWARE
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ RESPOND (TOKEN STILL SENT FOR OLD FRONTEND SUPPORT)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // ✅ keep for backward compatibility
      ip: userIP,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        lastLoginIP: user.lastLoginIP,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================================
// ✅ LOGOUT CONTROLLER (CLEAR COOKIE)
// ================================================
const logoutUser = (req, res) => {
  res.clearCookie("kzarre_token", {
    path: "/",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ================================================
// ✅ EXPORT
// ================================================
module.exports = {
  auth,
  loginUser,
  logoutUser,
};
