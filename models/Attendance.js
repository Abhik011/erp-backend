const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  staffId:  { type: String, required: true },       // e.g. "STF-3A7KX9"
  name:     { type: String, required: true },
  department: String,
  date:     { type: Date,   required: true },
  checkIn:  String,      // "09:00 AM"
  checkOut: String,      // "05:00 PM"
  status:   { type: String, enum: ["Present", "Absent", "Late"], default: "Absent" },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
