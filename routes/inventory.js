const express = require("express")
const router = express.Router()
const Inventory = require("../models/Inventory")

router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find()
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" })
  }
})

router.post("/", async (req, res) => {
  try {
    const item = new Inventory(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ error: "Failed to add item", message: err.message })
  }
})

module.exports = router
