const crypto = require("crypto");
const Customer = require("../models/Customer");

// ✅ STEP 1: REQUEST OTP FOR PASSWORD RESET
exports.requestResetOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "If account exists, OTP has been generated",
      });
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save();

    // ✅ For now we return OTP in response
    // (Later you can send via SMS/WhatsApp)
    res.json({
      success: true,
      message: "OTP generated successfully",
      otp, // ⚠️ REMOVE THIS IN PRODUCTION WITH SMS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ STEP 2: VERIFY OTP
exports.verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await Customer.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ STEP 3: RESET PASSWORD
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await Customer.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword; // ✅ Will auto-hash from pre-save hook
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
