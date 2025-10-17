const mongoose = require("mongoose")

const AdmissionSchema = new mongoose.Schema({
  admissionId: { type: String, unique: true }, // Custom Admission ID
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, required: true },
  batch: { type: String, required: true },
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  feeStatus: {
    type: String,
    enum: ["Pending", "Partially Paid", "Paid", "Refunded"],
    default: "Pending",
  },
  documents: [String],
  notes: { type: String, default: "" },
})

// Pre-save hook to generate admissionId
AdmissionSchema.pre("save", async function (next) {
  if (this.isNew && !this.admissionId) {
    const lastAdmission = await mongoose
      .model("Admission")
      .findOne()
      .sort({ createdAt: -1 })
      .select("admissionId")

    let nextNumber = 1
    if (lastAdmission?.admissionId) {
      const parts = lastAdmission.admissionId.split("-")
      const number = parseInt(parts[1])
      if (!isNaN(number)) nextNumber = number + 1
    }

    this.admissionId = `ADMYR0-${nextNumber}`
  }
  next()
})

module.exports = mongoose.model("Admission", AdmissionSchema)
