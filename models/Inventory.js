const mongoose = require("mongoose")

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: String, required: true },
    supplier: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Inventory", inventorySchema)
