const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const { auth } = require("../middlewares/auth");  // your middleware

/* ==========================================================
   ADD ADDRESS (USER AUTOMATIC)
========================================================== */
router.post("/add", auth(), async (req, res) => {
  try {
    const userId = req.user._id;  // ❤️ real decoded id from token

    const address = await Address.create({
      user: userId,
      ...req.body
    });

    res.json({ success: true, address });
  } catch (err) {
    console.error("Add address failed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ==========================================================
   GET ALL USER ADDRESSES
========================================================== */
router.get("/list", auth(), async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, addresses });
  } catch (err) {
    console.error("Address list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
