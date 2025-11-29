const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },

      // 🔥 Premium Shipping Label Fields (Frontend Dynamic Printing)
      name: { type: String },     // Product Name
      image: { type: String },    // Primary Image URL
      sku: { type: String },      // 🔥 MAIN SKU
      barcode: { type: String },  // Variant SKU or Item Barcode

      // Variant Details
      size: { type: String },
      color: { type: String }
    }
  ],

  address: {
    name: String,
    phone: String,
    pincode: String,
    city: String,
    state: String,
    line1: String,
  },

  amount: Number,

  paymentMethod: { type: String, default: "COD" },
  paymentId: String,
  orderId: String,

  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "failed",
      "shipped",
      "delivered",
      "cancelled"
    ],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
