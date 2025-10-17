/* models/PurchaseOrder.js */
const mongoose = require("mongoose");
const pad = (n, len = 3) => String(n).padStart(len, "0");

const purchaseOrderSchema = new mongoose.Schema(
  {
    id:        { type: String, unique: true },          // ← no “required” or manual validator
    supplierId:{ type: String, required: true },
    supplier:  String,
    items:     { type: String, required: true },
    quantity:  String,
    totalAmount:String,
    orderDate: String,
    expectedDelivery: String,
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    notes: String,
  },
  { timestamps: true }
);

/* ─── generate PO id *before validation* ─── */
purchaseOrderSchema.pre("validate", async function (next) {
  if (this.id) return next();              // already set

  try {
    const year   = new Date().getFullYear();
    const prefix = `PO${year}`;            // e.g. PO2025
    const re     = new RegExp(`^${prefix}-\\d{3}$`);

    const last = await mongoose
      .model("PurchaseOrder")
      .find({ id: re })
      .sort({ id: -1 })
      .limit(1)
      .lean();

    const seq = last.length
      ? parseInt(last[0].id.split("-")[1], 10) + 1
      : 1;

    this.id = `${prefix}-${pad(seq)}`;     // PO2025-001, -002…
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
