const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Customer = require("../models/Customer");
const Address = require("../models/Address");

/* ============================================================
   AUTH MIDDLEWARE
============================================================ */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

/* ============================================================
   GET USER PROFILE
============================================================ */
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await Customer.findById(req.userId).select("-password -otp -otpExpires");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

/* ============================================================
   UPDATE USER PROFILE (name, email, phone)
============================================================ */
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const updated = await Customer.findByIdAndUpdate(
      req.userId,
      { name, email, phone },
      { new: true }
    ).select("-password -otp -otpExpires");

    res.json({ success: true, user: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

/* ============================================================
   GET ALL ADDRESSES FOR USER
============================================================ */
router.get("/address/list", auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.userId }).sort({ createdAt: -1 });

    res.json({ success: true, addresses });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

/* ============================================================
   ADD ADDRESS
============================================================ */
router.post("/address/add", auth, async (req, res) => {
  try {
    const payload = {
      user: req.userId,
      title: req.body.title,
      name: req.body.name,
      phone: req.body.phone,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      line1: req.body.line1,
    };

    const address = await Address.create(payload);

    res.json({ success: true, address });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

/* ============================================================
   UPDATE ADDRESS
============================================================ */
router.put("/address/update/:id", auth, async (req, res) => {
  try {
    const addr = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );

    if (!addr)
      return res.status(404).json({ success: false, message: "Address not found" });

    res.json({ success: true, address: addr });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

/* ============================================================
   DELETE ADDRESS
============================================================ */
router.delete("/address/delete/:id", auth, async (req, res) => {
  try {
    const deleted = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Address not found" });

    res.json({ success: true, message: "Address deleted" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", err });
  }
});

module.exports = router;
