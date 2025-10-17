const express = require("express");
const router = express.Router();
const FranchiseModel = require("../models/Franchise");
const RoleModel = require("../models/Role");

// GET all franchises
router.get("/franchises", async (req, res) => {
  try {
    const franchises = await FranchiseModel.find();
    res.json(franchises);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch franchises" });
  }
});

// GET all roles
router.get("/roles", async (req, res) => {
  try {
    const roles = await RoleModel.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

module.exports = router;
