const express = require("express");
const Department = require("../models/Department");
const router = express.Router();

/* ─────────────── READ ─────────────── */
router.get("/", async (_req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── CREATE ─────────────── */
router.post("/", async (req, res) => {
  try {
    const department = new Department(req.body);   // id auto-generated in model
    await department.save();
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ─────────────── UPDATE ─────────────── */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Department not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ─────────────── DELETE ─────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Department not found" });
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
