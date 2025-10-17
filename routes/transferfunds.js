const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Account = require("../models/Account");
const TransferFund = require("../models/Transferfunds");

// GET all transfers
router.get("/", async (_req, res) => {
  try {
    const data = await TransferFund.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transfers", error: err.message });
  }
});

// GET transfer by Mongo _id (unchanged)
router.get("/:id", async (req, res) => {
  try {
    const data = await TransferFund.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Transfer not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transfer", error: err.message });
  }
});

// POST create transfer (auto transferId, balance -/+)
// Accepts either account IDs (fromAccountId/toAccountId) or names (fromAccount/toAccount)
router.post("/", async (req, res) => {
  try {
    const {
      fromAccountId,
      toAccountId,
      fromAccount, // name fallback
      toAccount,   // name fallback
      amount,
      reference,
      date,
      approvedBy,
      notes,
    } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: "amount must be > 0" });

    const fromQuery = fromAccountId ? { accountId: fromAccountId } : { name: fromAccount };
    const toQuery = toAccountId ? { accountId: toAccountId } : { name: toAccount };

    // Try transaction first (if MongoDB is a replica set)
    const session = await mongoose.startSession();
    let created;
    try {
      await session.withTransaction(async () => {
        const src = await Account.findOne(fromQuery).session(session);
        const dst = await Account.findOne(toQuery).session(session);

        if (!src || !dst) throw new Error("Source or destination account not found");
        if (String(src._id) === String(dst._id))
          throw new Error("from and to accounts cannot be the same");
        if ((src.balance ?? 0) < amt) throw new Error("Insufficient funds");

        src.balance = Number(src.balance) - amt;
        dst.balance = Number(dst.balance) + amt;

        await src.save({ session });
        await dst.save({ session });

        created = await TransferFund.create(
          [
            {
              fromAccountId: src.accountId,
              toAccountId: dst.accountId,
              fromAccount: src.name,
              toAccount: dst.name,
              amount: amt,
              reference,
              date: date || new Date(),
              approvedBy,
              notes,
              status: "Completed",
            },
          ],
          { session }
        );
        created = created[0];
      });
    } catch (txErr) {
      // Fallback for standalone MongoDB (no transactions)
      session.endSession();
      try {
        const src = await Account.findOneAndUpdate(
          { ...fromQuery, balance: { $gte: amt } },
          { $inc: { balance: -amt } },
          { new: true }
        );
        const dst = await Account.findOneAndUpdate(
          toQuery,
          { $inc: { balance: +amt } },
          { new: true }
        );

        if (!src || !dst) throw new Error("Source/Destination not found or insufficient funds");

        created = await TransferFund.create({
          fromAccountId: src.accountId,
          toAccountId: dst.accountId,
          fromAccount: src.name,
          toAccount: dst.name,
          amount: amt,
          reference,
          date: date || new Date(),
          approvedBy,
          notes,
          status: "Completed",
        });
      } catch (e2) {
        return res.status(400).json({ message: e2.message || "Transfer failed" });
      }
      return res.status(201).json(created);
    }

    session.endSession();
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving transfer", error: err.message });
  }
});

module.exports = router;
