const mongoose = require("mongoose")

const LSQEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    course: { type: String, required: true },
    source: { type: String, required: true },
    notes: { type: String },
    status: { type: String, default: "New" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model("LSQEnquiry", LSQEnquirySchema)
