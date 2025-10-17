const mongoose = require("mongoose");

const yyyymmdd = (d = new Date()) =>
  d.getFullYear().toString() +
  String(d.getMonth() + 1).padStart(2, "0") +
  String(d.getDate()).padStart(2, "0");
const rand4 = () => Math.floor(1000 + Math.random() * 9000);
const genAccountId = () => `ACC-${yyyymmdd()}-${rand4()}`;

const AccountSchema = new mongoose.Schema(
  {
    accountId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    bank: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, unique: true, trim: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

AccountSchema.pre("save", function (next) {
  if (!this.accountId) this.accountId = genAccountId();
  if (this.balance == null) this.balance = 0;
  next();
});

module.exports = mongoose.model("Account", AccountSchema);
