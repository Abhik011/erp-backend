const express   = require("express");
const Supplier  = require("../models/Supplier");
const router    = express.Router();

/* helper → SUP0006, SUP0007 … */
const nextSupplierId = async () => {
  const count = await Supplier.countDocuments();
  return `SUP${String(count + 1).padStart(4, "0")}`;
};

/* ───────── LIST ───────── */
router.get("/", async (_, res) => {
  const data = await Supplier.find().sort({ createdAt: -1 });
  res.json(data);
});

/* ───────── SINGLE ───────── */
router.get("/:supplierId", async (req, res) => {
  const s = await Supplier.findOne({ supplierId: req.params.supplierId });
  return s ? res.json(s) : res.status(404).json({ error: "Not found" });
});

/* ───────── CREATE ───────── */
router.post("/", async (req, res) => {
  try {
    /* you can still POST supplierId explicitly; otherwise we generate it */
    const supplierId = req.body.supplierId || (await nextSupplierId());
    const payload = { ...req.body, supplierId };

    const created = await Supplier.create(payload);
    res.status(201).json(created);
  } catch (err) {
    /* ⬇ show real reason */
    console.error("Supplier insert error →", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ───────── UPDATE ───────── */
router.put("/:supplierId", async (req, res) => {
  try {
    const updated = await Supplier.findOneAndUpdate(
      { supplierId: req.params.supplierId },
      req.body,
      { new: true, runValidators: true }
    );
    return updated
      ? res.json(updated)
      : res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ───────── DELETE ───────── */
router.delete("/:supplierId", async (req, res) => {
  const del = await Supplier.findOneAndDelete({
    supplierId: req.params.supplierId,
  });
  return del
    ? res.json({ message: `${del.supplierId} deleted` })
    : res.status(404).json({ error: "Not found" });
});

module.exports = router;
