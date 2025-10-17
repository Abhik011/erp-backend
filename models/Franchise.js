const mongoose = require("mongoose")

const FranchiseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  owner: { type: String, required: true },
  students: { type: Number, default: 0 },
  staff: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Pending", "Inactive"], default: "Pending" },
  type: { type: String, enum: ["Premium", "Standard"], default: "Standard" },
})

module.exports = mongoose.model("Franchise", FranchiseSchema)
