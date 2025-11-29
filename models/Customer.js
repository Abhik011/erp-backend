const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    // ✅ Country Code
    countryCode: {
      type: String,
      default: "+91",
      trim: true,
    },

    // ✅ Phone number
    phone: {
      type: String,
      trim: true,
    },

    // ✅ Full phone number
    fullPhone: {
      type: String,
      trim: true,
    },

    isVerified: { type: Boolean, default: false },

    // ✅ OTP Login / Verification (UNCHANGED)
    otp: { type: String },
    otpExpires: { type: Date },

    // ✅ ✅ FORGOT PASSWORD (NEW - SECURE)
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// ✅ AUTO–GENERATE fullPhone + HASH PASSWORD
CustomerSchema.pre("save", async function (next) {
  // ✅ Hash password only if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // ✅ Auto create full phone number
  if (this.phone && this.countryCode) {
    this.fullPhone = `${this.countryCode} ${this.phone}`;
  }

  next();
});

// ✅ Compare Password
CustomerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Customer", CustomerSchema);
