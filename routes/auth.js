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
    if (!institute || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email, institute });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Incorrect password" });

    // ✅ Safe user object
    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      institute: user.institute,
    };

    // store in session
    req.session.user = safeUser;

    // save session before responding
    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "Session save error" });
      console.log("Session saved:", req.sessionID);
      res.status(200).json({ message: "Login successful", user: safeUser });
    });

  } catch (err) {
    console.error(err);
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
