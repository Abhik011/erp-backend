/* routes/uploadRoute.js */
const express  = require("express");
const multer   = require("multer");
const dns      = require("dns");  // optional: force IPv4 first
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

dns.setDefaultResultOrder("ipv4first"); // ← optional but cures some VPN DNS quirks

const router = express.Router();

/* ---------- 1. AWS S3 v3 client (path-style) ---------- */
const REGION   = process.env.AWS_REGION;           // "ap-south-1"
const BUCKET   = process.env.AWS_BUCKET_NAME;

const s3 = new S3Client({
  region: REGION,
  endpoint: `https://s3.${REGION}.amazonaws.com`,  // ← explicit endpoint
  forcePathStyle: true,                            // ← critical
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ---------- 2. Multer: memory, 2 MB, images-only ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only images")),
});

function withMulter(field) {
  const mw = upload.single(field);
  return (req, res, next) =>
    mw(req, res, (err) => {
      if (err instanceof multer.MulterError)
        return res.status(400).json({ error: err.message });
      if (err) return next(err);
      next();
    });
}

/* ---------- 3. POST /api/upload ---------- */
router.post("/", withMulter("profile"), async (req, res) => {
  try {
    const userId = req.user?.id || "anonymous";
    if (!req.file) throw new Error("No file attached");

    const key = `profiles/${userId}/${Date.now()}-${req.file.originalname}`;
    console.log("→ S3 PUT", key);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key:    key,
        Body:   req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    /* Public URL must match path-style as well */
    const url = `https://s3.${REGION}.amazonaws.com/${BUCKET}/${key}`;
    res.json({ url, key });
  } catch (err) {
    console.error("✖ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
