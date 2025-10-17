const express = require("express");
const router = express.Router();
const ExchangeOrder = require("../models/ExchangeOrder");

/* GET all */
router.get("/", async (req, res) => {
  const orders = await ExchangeOrder.find().sort({ createdAt: -1 });
  res.json(orders);
});

/* GET one */
router.get("/:id", async (req, res) => {
  const order = await ExchangeOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

/* POST create */
router.post("/", async (req, res) => {
  try {
    const order = await new ExchangeOrder(req.body).save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* PUT update */
router.put("/:id", async (req, res) => {
  try {
    const updated = await ExchangeOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE */
router.delete("/:id", async (req, res) => {
  const deleted = await ExchangeOrder.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ message: `${deleted.id} deleted` });
});

module.exports = router;
