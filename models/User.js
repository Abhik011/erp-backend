const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  institute: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  photoUrl: { type: String, default: "" },

  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
  },

  twoFactorEnabled: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
