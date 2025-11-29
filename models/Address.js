const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: { type: String, default: "Home" },
  name: String,
  phone: String,
  pincode: String,
  city: String,
  state: String,
  line1: String,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Address", addressSchema);
