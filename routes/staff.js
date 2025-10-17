const express = require("express");
const router  = express.Router();
const Staff   = require("../models/Staff");

/* GET /api/staff  – latest first */
router.get("/", async (_req, res) => {
  try {
    const list = await Staff.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/staff  – create */
router.post("/", async (req, res) => {
  try {
    const doc = await new Staff(req.body).save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* PUT /api/staff/:id  – update */
router.put("/:id", async (req, res) => {
  try {
    const doc = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Staff not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE /api/staff/:id  – remove */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Staff.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Staff not found" });
    res.json({ message: `${doc.name} deleted` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
