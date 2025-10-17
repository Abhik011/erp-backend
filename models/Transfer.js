// backend/models/Transfer.js
const mongoose = require("mongoose")

const transferSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  currentStage: { type: String, required: true },
  nextStage: { type: String, required: true },
  requestDate: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  notes: { type: String },
})

module.exports = mongoose.model("Transfer", transferSchema)
