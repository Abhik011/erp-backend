/* models/Supplier.js ------------------------------------------------ */
const mongoose = require("mongoose");

/* helper: 7  →  "007" */
const pad = (n, len = 3) => String(n).padStart(len, "0");

const supplierSchema = new mongoose.Schema(
  {
    supplierId: { type: String, unique: true },   // ⚠️  no “required”
    name:       { type: String, required: true },
    contact:      String,
    email:      {
      type:  String,
      match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid e-mail"],
    },
    address:    String,
  },
  { timestamps: true }
);

/* ───── auto-generate supplierId ───── */
supplierSchema.pre("save", async function (next) {
  // if an ID was already set (e.g. during import) → skip
  if (this.supplierId) return next();

  try {
    const year   = new Date().getFullYear();
    const prefix = `SUP${year}`;            // e.g. SUP2025
    const re     = new RegExp(`^${prefix}-\\d{3}$`);

    // find the last supplier for this year
    const last = await mongoose
      .model("Supplier")
      .find({ supplierId: re })
      .sort({ supplierId: -1 })
      .limit(1)
      .lean();

    const seq = last.length
      ? parseInt(last[0].supplierId.split("-")[1], 10) + 1
      : 1;

    this.supplierId = `${prefix}-${pad(seq)}`;   // SUP2025-001, …-002 …
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Supplier", supplierSchema);
