const mongoose = require("mongoose");

const TeachingSubjectSchema = new mongoose.Schema(
  {
    allocId: { type: String, unique: true, uppercase: true, trim: true },

    staffId:   { type: String, required: true },
    staffName: { type: String, required: true },
    department:{ type: String, required: true },
    subject:   { type: String, required: true },
    course:    { type: String, required: true },
    batch:     { type: String, required: true },
    semester:  { type: String, required: true },

    status: { type: String, enum: ["Active", "On Leave"], default: "Active" },
  },
  { timestamps: true }
);

/* generate allocId → “TS-XXXXXX” */
TeachingSubjectSchema.pre("save", async function (next) {
  if (this.allocId) return next();
  const { customAlphabet } = await import("nanoid");
  const nano = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
  this.allocId = `TS-${nano()}`;
  next();
});

module.exports = mongoose.model("TeachingSubject", TeachingSubjectSchema);
