// routes/franchise.js
const express = require("express");
const router = express.Router();
const FranchiseModel = require("../models/Franchise");
const RoleModel = require("../models/Role");

// GET franchises
router.get("/franchises", async (req, res) => {
  try {
    const franchises = await FranchiseModel.find();
    res.json(franchises);
  } catch (error) {
    res.status(500).json({ message: "Error fetching franchises" });
  }
});

// GET roles
router.get("/roles", async (req, res) => {
  try {
    const roles = await RoleModel.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles" });
  }
});

module.exports = router;
