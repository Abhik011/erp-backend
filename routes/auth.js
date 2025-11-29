const express = require("express");
const { register, login, verifyOtp } = require("../controllers/authController");
const router = express.Router();

// ✅ Register
router.post("/register", register);

// ✅ Verify Email OTP
router.post("/verify-otp", verifyOtp);

// ✅ Login (THIS NOW SETS COOKIE)
router.post("/login", login);

module.exports = router;
