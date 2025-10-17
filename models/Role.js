
const mongoose = require("mongoose")

const RoleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  users: { type: Number, default: 0 },
  permissions: { type: String }, // Or array if needed
})

module.exports = mongoose.model("Role", RoleSchema)
