const mongoose = require("mongoose");

// helper to mint IDs like “EXO-1A2B3C”
async function makeId() {
  const { customAlphabet } = await import("nanoid");
  return "EXO-" + customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6)();
}

const ExchangeOrderSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, uppercase: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    oldItem: { type: String, required: true, trim: true },
    newItem: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    date: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// generate ID automatically
ExchangeOrderSchema.pre("save", async function (next) {
  if (!this.id) this.id = await makeId();
  next();
});

module.exports = mongoose.model("ExchangeOrder", ExchangeOrderSchema);
