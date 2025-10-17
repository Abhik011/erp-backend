const express = require("express");
const router = express.Router();
const PurchaseOrder = require("../models/PurchaseOrder");

/* ───────────────────── CREATE ───────────────────── */
router.post("/", async (req, res) => {
  try {
    // Remove any client-supplied poId so it doesn’t override the generator
    const { poId, ...body } = req.body;

    const po = await PurchaseOrder.create(body);
    res.status(201).json(po);            // returns poId that was generated
  } catch (err) {
    console.error("[PO-POST] ", err);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

/* ───────────────────── READ (all) ───────────────────── */
router.get("/", async (_req, res) => {
  try {
    const orders = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("[PO-GET] ", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ───────────────────── READ (single) ───────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    console.error("[PO-GET:id] ", err);
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ───────────────────── UPDATE ───────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const updated = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("[PO-PUT] ", err);
    res.status(400).json({ error: "Update failed" });
  }
});

/* ───────────────────── DELETE ───────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: `Purchase order ${deleted.id} deleted` });
  } catch (err) {
    console.error("[PO-DEL] ", err);
    res.status(400).json({ error: "Deletion failed" });
  }
});

module.exports = router;
