const crypto = require("crypto");
const Customer = require("../models/Customer");
const { sendEmail } = require("../utils/sendEmail");


// ✅ FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const message = `
You requested a password reset.

Click here to reset:
${resetUrl}

If you did not request this, ignore this email.
    `;

    await sendEmail(user.email, "Password Reset - KZARRE", message);

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await Customer.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalid or expired" });
    }

    user.password = password; // ✅ Your model already hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
