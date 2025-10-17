// routes/role.js
const express = require("express");
const router = express.Router();
const RoleModel = require("../models/Role");

// GET all roles
router.get("/", async (req, res) => {
  try {
    const roles = await RoleModel.find();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Server error while fetching roles" });
  }
});

// POST create a new role
router.post("/", async (req, res) => {
  try {
    const { name, description, permissions, users } = req.body;

    const newRole = new RoleModel({
      name,
      description,
      permissions,
      users,
    });

    await newRole.save();
    res.status(201).json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Server error while creating role" });
  }
});

// PUT update a role
router.put("/:id", async (req, res) => {
  try {
    const updatedRole = await RoleModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error while updating role" });
  }
});

// DELETE a role
router.delete("/:id", async (req, res) => {
  try {
    await RoleModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Server error while deleting role" });
  }
});

module.exports = router;
