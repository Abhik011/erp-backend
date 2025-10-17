const express = require("express");
const router  = express.Router();
const Attendance = require("../models/Attendance");

/* GET /api/attendance?date=YYYY-MM-DD&search=&status= */
router.get("/", async (req, res) => {
  const { date, search = "", status } = req.query;
  const q   = {};
  if (date) q.date = { $eq: new Date(date) };
  if (status && status !== "all") q.status = status;
  if (search)
    q.$or = [
      { name:     new RegExp(search, "i") },
      { staffId:  new RegExp(search, "i") },
      { department:new RegExp(search, "i") },
    ];
  const list = await Attendance.find(q).sort({ staffId: 1 });
  res.json(list);
});

/* PATCH /api/attendance/:id – quick “Mark Present” */
router.patch("/:id/mark-present", async (req, res) => {
  const doc = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status: "Present", checkIn: req.body.checkIn ?? "09:00 AM" },
    { new: true }
  );
  res.json(doc);
});

module.exports = router;
