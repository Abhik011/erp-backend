const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ADD NEW ADDRESS
router.post("/address/add", async (req, res) => {
  try {
    const { userId, title, name, address, postal, phone } = req.body;

    if (!userId)
      return res.status(400).json({ success: false, message: "Missing userId" });

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const newAddress = {
      _id: Date.now(),
      title,
      name,
      address,
      postal,
      phone,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      address: newAddress,
    });
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
