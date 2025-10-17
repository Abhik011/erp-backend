const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Graduationnamechangeconfirmation = require('../models/Graduationnamechangeconfirmation')

const router = express.Router()

// 🗂️ Setup Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-')
    cb(null, name)
  }
})

// ✅ File Filter and Upload Config
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Only PDF, JPG, and PNG are allowed'))
    }
    cb(null, true)
  }
})

// 📥 GET all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Graduationnamechangeconfirmation.find()
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error })
  }
})

// 📝 POST new request
router.post('/', upload.array('supportingDocs'), async (req, res) => {
  try {
    const files = req.files.map(file => file.path)
    const newRequest = new Graduationnamechangeconfirmation({
      ...req.body,
      supportingDocs: files
    })
    await newRequest.save()
    res.status(201).json(newRequest)
  } catch (error) {
    res.status(400).json({ message: 'Error creating request', error })
  }
})

// ✏️ PUT update request
router.put('/:id', async (req, res) => {
  try {
    const updatedRequest = await Graduationnamechangeconfirmation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.json(updatedRequest)
  } catch (error) {
    res.status(400).json({ message: 'Error updating request', error })
  }
})

// ❌ DELETE request
router.delete('/:id', async (req, res) => {
  try {
    await Graduationnamechangeconfirmation.findByIdAndDelete(req.params.id)
    res.json({ message: 'Request deleted' })
  } catch (error) {
    res.status(400).json({ message: 'Error deleting request', error })
  }
})

// ✅ Approve request
router.post('/:id/approve', async (req, res) => {
  try {
    const request = await Graduationnamechangeconfirmation.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    )
    res.json(request)
  } catch (error) {
    res.status(400).json({ message: 'Error approving request', error })
  }
})

// ❌ Reject request
router.post('/:id/reject', async (req, res) => {
  try {
    const request = await Graduationnamechangeconfirmation.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    )
    res.json(request)
  } catch (error) {
    res.status(400).json({ message: 'Error rejecting request', error })
  }
})

module.exports = router
