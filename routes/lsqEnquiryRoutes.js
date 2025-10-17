const express = require("express")
const router = express.Router()
const LSQEnquiry = require("../models/LSQEnquiry")

// GET all enquiries
router.get("/", async (req, res) => {
  try {
    const enquiries = await LSQEnquiry.find().sort({ createdAt: -1 })
    res.status(200).json(enquiries)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch enquiries", error })
  }
})

// POST new enquiry
router.post("/", async (req, res) => {
  try {
    const newEnquiry = new LSQEnquiry(req.body)
    const saved = await newEnquiry.save()
    res.status(201).json(saved)
  } catch (error) {
    res.status(400).json({ message: "Failed to create enquiry", error })
  }
})
router.get("/count", async (req, res) => {
    try {
      const count = await LSQEnquiry.countDocuments()
      res.status(200).json({ success: true, count })
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get count", error })
    }
  })

// PUT update enquiry
router.put("/:id", async (req, res) => {
  try {
    const updated = await LSQEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.status(200).json(updated)
  } catch (error) {
    res.status(400).json({ message: "Failed to update enquiry", error })
  }
})

// DELETE enquiry
router.delete("/:id", async (req, res) => {
  try {
    await LSQEnquiry.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Enquiry deleted successfully" })
  } catch (error) {
    res.status(400).json({ message: "Failed to delete enquiry", error })
  }
})

module.exports = router
