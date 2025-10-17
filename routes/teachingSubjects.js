const router = require("express").Router();
const TeachingSubject = require("../models/TeachingSubject");

/* ----- GET list (with ?search=) ----- */
router.get("/", async (req, res) => {
  const { search = "" } = req.query;
  const regex = new RegExp(search, "i");
  const list = await TeachingSubject.find({
    $or: [
      { staffName: regex }, { staffId: regex }, { department: regex },
      { subject: regex }, { course: regex },
    ],
  }).sort({ createdAt: -1 });
  res.json(list);
});

/* ----- POST create ----- */
router.post("/", async (req, res) => {
  try {
    const doc = await new TeachingSubject(req.body).save();
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/* ----- PUT update ----- */
router.put("/:id", async (req, res) => {
  try {
    const doc = await TeachingSubject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/* ----- DELETE ----- */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await TeachingSubject.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
