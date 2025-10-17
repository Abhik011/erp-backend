const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Former"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// 👇 Generate ID before saving
StaffSchema.pre("save", async function (next) {
  if (!this.id) {
    const { customAlphabet } = await import("nanoid");
    const makeId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
    this.id = `STF-${makeId()}`;
  }
  next();
});

module.exports = mongoose.model("Staff", StaffSchema);
