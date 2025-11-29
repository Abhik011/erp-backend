const express = require("express");
const router = express.Router();

const {
  requestEmailOtp,
  verifyEmailOtp,
  resetPasswordWithEmailOtp,
} = require("../controllers/emailOtpPasswordController");

router.post("/forgot-password", requestEmailOtp);
router.post("/verify-otp", verifyEmailOtp);
router.post("/reset-password", resetPasswordWithEmailOtp);

module.exports = router;
