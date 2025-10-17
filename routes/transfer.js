// backend/routes/transfer.js
const express = require("express")
const router = express.Router()
const Transfer = require("../models/Transfer")

// GET all transfer requests
router.get("/", async (req, res) => {
  try {
    const transfers = await Transfer.find()
    res.json(transfers)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transfers" })
  }
})

// POST approve transfer
router.post("/:id/approve", async (req, res) => {
    try {
      const updated = await Transfer.findByIdAndUpdate(
        req.params.id,
        { status: "Approved", notes: req.body.notes },
        { new: true }
      )
      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: "Failed to approve transfer" })
    }
  })
  
  // POST reject transfer
  router.post("/:id/reject", async (req, res) => {
    try {
      const updated = await Transfer.findByIdAndUpdate(
        req.params.id,
        { status: "Rejected", notes: req.body.notes },
        { new: true }
      )
      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: "Failed to reject transfer" })
    }
  })
  
// POST new transfer request
router.post("/", async (req, res) => {
  try {
    const newTransfer = new Transfer({
      ...req.body,
      requestDate: new Date().toISOString().split("T")[0],
      status: "Pending",
    })
    const saved = await newTransfer.save()
    res.status(201).json(saved)
  } catch (error) {
    res.status(500).json({ error: "Failed to add transfer" })
  }
})

// PUT update transfer request
router.put("/:id", async (req, res) => {
  try {
    const updated = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: "Failed to update transfer" })
  }
})

// DELETE a transfer request
router.delete("/:id", async (req, res) => {
  try {
    await Transfer.findByIdAndDelete(req.params.id)
    res.json({ message: "Deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transfer" })
  }
})

module.exports = router
