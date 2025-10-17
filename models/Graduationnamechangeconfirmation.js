const mongoose = require('mongoose')

const GraduationnamechangeconfirmationSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  oldName: { type: String, required: true },
  newName: { type: String, required: true },
  reason: { type: String, required: true },
  supportingDocs: [{ type: String }], // File paths or URLs
  requestDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
})

module.exports = mongoose.model(
  'Graduationnamechangeconfirmation',
  GraduationnamechangeconfirmationSchema
)
