const Customer = require("../models/Customer");
const { sendEmail } = require("../utils/sendEmail");

// ✅ STEP 1: REQUEST OTP VIA EMAIL
exports.requestEmailOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Customer.findOne({ email });

    // ✅ Silent response (prevents user enumeration)
    if (!user) {
      return res.json({
        message: "If account exists, OTP has been sent to email",
      });
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // ✅ Send OTP via Email (HTML)
    const html = `
      <div style="font-family: Arial, sans-serif; background: #000; padding: 40px;">
        <div style="max-width: 420px; margin: auto; background: #fff; padding: 30px; border-radius: 12px;">
          <h2 style="text-align: center; letter-spacing: 1px;">KZARRÈ</h2>
          <p>Your password reset OTP is:</p>
          <h1 style="text-align:center; letter-spacing: 6px;">${otp}</h1>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you didn’t request this, you can safely ignore it.</p>
        </div>
      </div>
    `;

    await sendEmail(
      user.email,
      "Your KZARRÈ Password Reset OTP",
      html
    );

    res.json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (err) {
    console.error("EMAIL OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ✅ STEP 2: VERIFY EMAIL OTP
exports.verifyEmailOtp = async (req, res) => {
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

// ✅ STEP 3: RESET PASSWORD WITH EMAIL OTP
exports.resetPasswordWithEmailOtp = async (req, res) => {
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

    user.password = newPassword; // ✅ auto-hashes via schema
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
