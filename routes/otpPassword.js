const express = require("express");
const router = express.Router();

const {
  requestResetOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
} = require("../controllers/otpPasswordController");

router.post("/forgot-password", requestResetOtp);
router.post("/verify-otp", verifyResetOtp);
router.post("/reset-password", resetPasswordWithOtp);

module.exports = router;
