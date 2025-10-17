// models/Enquiry.js
const mongoose = require("mongoose")

const EnquirySchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  program: { type: String, required: true },
  enquirerName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  locality: { type: String, required: true },
  referralSource: { type: String, required: true },
  followupDate: { type: Date, required: true },
  admissionForm: { type: Boolean, default: false },
  notes: { type: String },
  status: { type: String, default: "new" }
}, { timestamps: true })

module.exports = mongoose.model("Enquiry", EnquirySchema)
