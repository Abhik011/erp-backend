const express = require("express");
const router = express.Router();
const Account = require("../models/Account");

// GET all accounts
router.get("/", async (_req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// POST create new account (accountId is auto via model pre-save)
router.post("/", async (req, res) => {
  try {
    const { name, bank, accountNumber, balance } = req.body;
    if (!name || !bank || !accountNumber) {
      return res.status(400).json({ error: "Name, bank and account number are required" });
    }

    const savedAccount = await Account.create({
      name,
      bank,
      accountNumber,
      balance: balance ?? 0,
    });

    res.status(201).json(savedAccount);
  } catch (error) {
    console.error(error);
    // Handle dup accountNumber nicely
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Account number already exists" });
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

// (Optional) POST /api/account/:accountId/adjust  { amount: +100 | -50 }
router.post("/:accountId/adjust", async (req, res) => {
  try {
    const { accountId } = req.params;
    const amt = Number(req.body.amount);
    if (!amt && amt !== 0) return res.status(400).json({ error: "amount required" });

    // if withdrawal (negative), ensure balance won't go below 0
    const account = await Account.findOneAndUpdate(
      amt < 0
        ? { accountId, balance: { $gte: Math.abs(amt) } }
        : { accountId },
      { $inc: { balance: amt } },
      { new: true }
    );
    if (!account) return res.status(400).json({ error: "Not found or insufficient funds" });

    res.json(account);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to adjust balance" });
  }
});

module.exports = router;
