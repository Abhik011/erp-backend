// models/Deposit.js
const mongoose = require("mongoose")

const DepositSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ["Online", "Cash", "Cheque"],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Completed", "Pending", "Failed"],
    default: "Pending",
  },
})

module.exports = mongoose.model("Deposit", DepositSchema)
