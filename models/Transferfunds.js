const mongoose = require("mongoose");

const yyyymmdd = (d = new Date()) =>
  d.getFullYear().toString() +
  String(d.getMonth() + 1).padStart(2, "0") +
  String(d.getDate()).padStart(2, "0");
const rand4 = () => Math.floor(1000 + Math.random() * 9000);
const genTransferId = () => `TRF-${yyyymmdd()}-${rand4()}`;

const TransferFundSchema = new mongoose.Schema(
  {
    transferId: { type: String, unique: true, index: true },

    // Prefer IDs; keep names as snapshot for display
    fromAccountId: { type: String },
    toAccountId: { type: String },
    fromAccount: { type: String, required: true },
    toAccount: { type: String, required: true },

    amount: { type: Number, required: true, min: 0.01 },
    reference: { type: String },
    date: { type: Date, default: Date.now },
    approvedBy: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["Pending", "Completed", "Rejected"], default: "Completed" },
  },
  { timestamps: true }
);

TransferFundSchema.pre("save", function (next) {
  if (!this.transferId) this.transferId = genTransferId();
  next();
});

module.exports =
  mongoose.models.TransferFund || mongoose.model("TransferFund", TransferFundSchema);
