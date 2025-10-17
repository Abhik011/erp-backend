const express = require("express")
const router = express.Router()
const Admission = require("../models/Admission")
const LSQEnquiry = require("../models/LSQEnquiry")

// Helper to generate custom ID format (e.g., admyyy0-0)
const generateAdmissionId = async () => {
  const total = await Admission.countDocuments()
  const id = `ADM${new Date().getFullYear()}-${total}`
  return id
}

router.get("/students", async (req, res) => {
  try {
    const students = await Admission.find({}, "studentId name course batch")
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student list" })
  }
})
// GET all admissions
router.get("/", async (req, res) => {
  try {
    const admissions = await Admission.find()
    res.json(admissions)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// POST a new admission
router.post("/", async (req, res) => {
  try {
    const customId = await generateAdmissionId()
    const newAdmission = new Admission({ ...req.body, admissionId: customId })
    const savedAdmission = await newAdmission.save()
    res.status(201).json(savedAdmission)
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error })
  }
})

// Convert LSQ enquiry to admission
router.post("/convert/:id", async (req, res) => {
  try {
    const enquiry = await LSQEnquiry.findById(req.params.id)
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" })
    }

    const customId = await generateAdmissionId()

    const newAdmission = new Admission({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      course: enquiry.course,
      source: enquiry.source,
      notes: enquiry.notes,
      admissionId: customId,
      status: "Converted"
    })

    const savedAdmission = await newAdmission.save()

    enquiry.status = "Converted"
    await enquiry.save()

    res.status(201).json(savedAdmission)
  } catch (error) {
    console.error("Error converting to admission:", error)
    res.status(500).json({ message: "Conversion failed", error })
  }
})

// GET count
router.get("/count", async (req, res) => {
  try {
    const count = await Admission.countDocuments()
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: "Failed to count admissions" })
  }
})

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const updated = await Admission.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(400).json({ message: "Update failed", error })
  }
})

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id)
    res.json({ message: "Admission deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Deletion failed", error })
  }
})

// Approve admission
router.post("/:id/approve", async (req, res) => {
  try {
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { status: "Approved" },
      { new: true }
    )
    res.json(admission)
  } catch (error) {
    res.status(500).json({ message: "Approval failed", error })
  }
})

// Add/update documents
router.post("/:id/documents", async (req, res) => {
  try {
    const { documents } = req.body
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { documents },
      { new: true }
    )
    res.json(admission)
  } catch (error) {
    res.status(500).json({ message: "Document update failed", error })
  }
})
//student dataform the id 
router.get("/students/:studentId", async (req, res) => {
  try {
    const student = await Admission.findOne(
      { studentId: req.params.studentId },
      // ⬇︎ project only the fields the client needs
      "studentId name course batch"
    )

    if (!student) {
      return res.status(404).json({ error: "Admitted student not found" })
    }

    res.json(student)
  } catch (err) {
    console.error("Error fetching admitted student:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Chart stats
router.get("/admission-stats", async (req, res) => {
  try {
    const stats = await Admission.aggregate([
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          value: "$count",
          count: "$count",
          _id: 0,
        },
      },
    ])

    const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"]
    const chartData = stats.map((entry, index) => ({
      ...entry,
      fill: colors[index % colors.length],
    }))

    res.json(chartData)
  } catch (err) {
    console.error("Error generating admission stats:", err)
    res.status(500).json({ error: "Failed to fetch admission stats" })
  }
})

module.exports = router