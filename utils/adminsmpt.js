const nodemailer = require('nodemailer');

// ==============================
// ADMIN EMAIL ONLY
// ==============================
const adminTransporter = nodemailer.createTransport({
  service: process.env.ADMIN_EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL_USER,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// Verify connection
adminTransporter.verify((error) => {
  if (error) {
    console.error("❌ Admin Email transporter failed:", error.message);
  } else {
    console.log("✅ Admin Email transporter ready");
  }
});

/**
 * Send Admin Email (OTP, Alerts, Admin Notifications)
 */
exports.sendAdminEmail = async (to, subject, html) => {
  try {
    if (!process.env.ADMIN_EMAIL_USER || !process.env.ADMIN_EMAIL_PASS) {
      console.error("❌ Missing admin email credentials in .env");
      return;
    }

    const mailOptions = {
      from: `"KZARRÈ Admin" <${process.env.ADMIN_EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await adminTransporter.sendMail(mailOptions);
    console.log(`📧 Admin Email sent to ${to} | ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Admin Email send failed:", error.message);
  }
};
