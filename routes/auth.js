const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const router = express.Router();

// ====================== SIGNUP ======================
router.post("/signup", async (req, res) => {
  try {
    const { institute, name, email, password } = req.body;

    if (!institute || !email || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email, institute });
    if (existingUser) {
      return res.status(409).json({ message: "User already has an account" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ institute, name, email, password: hashedPassword });
    await user.save();

    res.status(200).json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== LOGIN ======================
router.post("/login", async (req, res) => {
  try {
    const { institute, email, password } = req.body;

    if (!institute || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email, institute });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // ✅ compare with bcrypt (your signup hashes)
    let ok = false;
    try {
      ok = await bcrypt.compare(password, user.password);
    } catch (_) {
      ok = false;
    }

    // (Optional backward-compat: if old plaintext existed)
    if (!ok && !/^\$2[aby]\$/.test(user.password)) {
      ok = password === user.password;
      if (ok) {
        // migrate to bcrypt silently
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!ok) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Build a safe user object (no password)
    const safeUser = {
      id: user._id.toString(),
      institute: user.institute,
      name: user.name,
      email: user.email,
    };

    // ✅ store user in session (kept your behavior but without password)
    req.session.user = safeUser;

    // ✅ ensure session is saved BEFORE responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save error" });
      }

      // 🔑 keep your session id log
      console.log("Session ID:", req.sessionID);

      return res.status(200).json({ message: "Login successful", user: safeUser });
    });

    // If you prefer stricter security, you can regenerate the session:
    // req.session.regenerate((regenErr) => { ...same as above... });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== LOGOUT ======================
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

module.exports = router;
