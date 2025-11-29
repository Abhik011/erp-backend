const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    _id: { type: Number }, // timestamp id for frontend
    title: { type: String, required: true }, 
    name: { type: String, required: true },
    address: { type: String, required: true },
    postal: { type: String, required: true },
    phone: { type: String, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  // 👇 PRIVATE address storage (each user has their own array)
  addresses: {
    type: [addressSchema],
    default: []
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
