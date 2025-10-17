const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const EnquiryModel = require("../models/Enquiry");

// ✅ Utility function for chart color
function getRandomColor(index) {
  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1",
    "#ec4899", "#22d3ee", "#14b8a6", "#f97316", "#8b5cf6",
  ];
  return colors[index % colors.length];
}

// ✅ POST: Create a new enquiry
router.post("/enquiries", async (req, res) => {
  try {
    const enquiry = new EnquiryModel(req.body);
    await enquiry.save();
    res.status(201).json({ success: true, data: enquiry });
  } catch (error) {
    console.error("Error saving enquiry:", error);
    res.status(500).json({ success: false, error: "Server error while creating enquiry" });
  }
});

// ✅ GET: Enquiry stats (MUST be above /enquiries/:id)
router.get("/enquiry-stats", async (req, res) => {
  try {
    const stats = await EnquiryModel.aggregate([
      {
        $group: {
          _id: "$program",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          value: "$count",
          _id: 0,
        },
      },
    ]);

    const chartData = stats.map((item, index) => ({
      ...item,
      fill: getRandomColor(index),
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error generating enquiry stats:", error);
    res.status(500).json({ message: "Failed to generate stats" });
  }
});

// ✅ GET: Count all enquiries
router.get("/enquiries/count", async (req, res) => {
  try {
    const count = await EnquiryModel.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error counting enquiries:", error);
    res.status(500).json({ success: false, error: "Server error while counting enquiries" });
  }
});

// ✅ GET: Fetch all enquiries
router.get("/enquiries", async (req, res) => {
  try {
    const enquiries = await EnquiryModel.find();
    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({ success: false, error: "Server error while fetching enquiries" });
  }
});

// ✅ GET: Fetch enquiry by ID (must be AFTER fixed routes)
router.get("/enquiries/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: "Invalid enquiry ID" });
  }

  try {
    const enquiry = await EnquiryModel.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    console.error("Error fetching enquiry by ID:", error);
    res.status(500).json({ success: false, error: "Server error while fetching enquiry" });
  }
});

// ✅ PUT: Update an enquiry by ID
router.put("/enquiries/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: "Invalid enquiry ID" });
  }

  try {
    const updatedEnquiry = await EnquiryModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedEnquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.json({ success: true, data: updatedEnquiry });
  } catch (error) {
    console.error("Error updating enquiry:", error);
    res.status(500).json({ success: false, error: "Server error while updating enquiry" });
  }
});

// ✅ DELETE: Delete an enquiry by ID
router.delete("/enquiries/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: "Invalid enquiry ID" });
  }

  try {
    const deleted = await EnquiryModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({ success: false, error: "Server error while deleting enquiry" });
  }
});

module.exports = router;
