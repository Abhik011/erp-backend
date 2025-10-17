// backend/routes/deposit.js
const express = require("express")
const router = express.Router()
const Deposit = require("../models/Deposit")

// GET all deposits
router.get("/", async (req, res) => {
  try {
    const deposits = await Deposit.find()
    res.json(deposits)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deposit records" })
  }
})

// POST new deposit
router.post("/", async (req, res) => {
  try {
    const newDeposit = new Deposit(req.body)
    const saved = await newDeposit.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error("Deposit Error:", error) // Add this
    res.status(500).json({ error: "Failed to add deposit", details: error.message })
  }
})


// PUT update deposit
router.put("/:id", async (req, res) => {
  try {
    const updated = await Deposit.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: "Failed to update deposit" })
  }
})

// DELETE a deposit
router.delete("/:id", async (req, res) => {
  try {
    await Deposit.findByIdAndDelete(req.params.id)
    res.json({ message: "Deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete deposit" })
  }
})

module.exports = router
