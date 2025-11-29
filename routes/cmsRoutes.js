const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const CMSContent = require("../models/CMSContent");
require("dotenv").config();

// =============================
// 🔹 AWS S3 Setup
// =============================
console.log("🧩 AWS ENV CHECK:", {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "✅ Loaded" : "❌ Missing",
  secretKey: process.env.AWS_SECRET_ACCESS_KEY ? "✅ Loaded" : "❌ Missing",
  bucket: process.env.AWS_BUCKET_NAME,
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// =============================
// 🔹 Multer Config (in-memory)
// =============================
const storage = multer.memoryStorage();
const upload = multer({ storage }); // ✅ Do NOT call .any() here

const uploadToS3 = async (file, displayTo) => {
  try {
    let folder = "cms/others";
    if (displayTo === "home-landing-video") folder = "cms/videos";
    else if (displayTo === "home-banner") folder = "cms/images/banners";
    else if (displayTo === "men-page-video") folder = "cms/videos/men";
    else if (displayTo === "women-page-video") folder = "cms/videos/women";
    else if (displayTo === "accessories-video")
      folder = "cms/videos/accessories";
    else if (displayTo === "heritage-video") folder = "cms/videos/heritage";
    else if (displayTo === "post") folder = "cms/images/posts";
    else if (displayTo === "about-page") folder = "cms/images/about";
    else if (displayTo === "product-page") folder = "cms/images/products";

    const fileName = `${crypto.randomBytes(8).toString("hex")}-${
      file.originalname
    }`;
    const key = `${folder}/${fileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log(`✅ Uploaded to S3: ${fileUrl}`);
    return fileUrl;
  } catch (err) {
    console.error("❌ uploadToS3 Error:", err);
    throw err;
  }
};

// =============================
// ✅ Save CMS Content (Create Post)
// =============================
// =============================
// ✅ Save CMS Content (Create Post)
// =============================
router.post("/save", upload.any(), async (req, res) => {
  try {
    const {
      title,
      description,
      displayTo,
      visibleDate,
      visibleTime,
      metaTag,
      metaDescription,
      keywords,
      titles,
      descriptions,
      metaTags,
      metaDescriptions,
      keywords: perImageKeywords,
    } = req.body;

    const displayToValue = displayTo || "";

    // -----------------------------
    // FIX KEYWORDS (meta.keywords)
    // Always convert to string
    // -----------------------------
    let cleanKeywords = keywords;
    try {
      const parsed = JSON.parse(keywords);
      cleanKeywords = Array.isArray(parsed) ? parsed.join(",") : keywords;
    } catch {
      cleanKeywords = keywords; // if not JSON, keep as string
    }

    // -----------------------------
    // Files
    // -----------------------------
    const videoFile = req.files?.find((f) => f.mimetype.startsWith("video/"));
    const imageFiles = req.files?.filter((f) =>
      f.mimetype.startsWith("image/")
    );

    let heroVideoUrl = null;
    let media = null;
    let mediaGroup = [];

    // ============================================
    // 1️⃣ Home Landing Video
    // ============================================
    if (
      displayToValue === "home-landing-video" ||
      displayToValue === "men-page-video" ||
      displayToValue === "women-page-video" ||
      displayToValue === "accessories-video" ||
      displayToValue === "heritage-video"
    ) {
      if (!videoFile)
        return res.status(400).json({ error: "Video required for landing" });

      heroVideoUrl = await uploadToS3(videoFile, displayToValue);

      media = {
        url: heroVideoUrl,
        name: videoFile.originalname,
        kind: "video",
        displayTo: displayToValue,
      };
    }

    // ============================================
    // 2️⃣ Single Banners (1 image)
    // ============================================
    else if (["bannerOne", "bannerTwo"].includes(displayToValue)) {
      if (!imageFiles || imageFiles.length !== 1)
        return res.status(400).json({ error: "Exactly 1 image required" });

      const url = await uploadToS3(imageFiles[0], displayToValue);

      const { title, description } = req.body; // ⬅️ added

      media = {
        url,
        name: imageFiles[0].originalname,
        kind: "image",
        displayTo: displayToValue,
        title, // ⬅️ added
        description, // ⬅️ added
      };
    }

    // ============================================
    // 3️⃣ Women / Men 4-Grid (EXACT 4 images)
    // ============================================
    else if (["women-4grid", "men-4grid"].includes(displayToValue)) {
      if (!imageFiles || imageFiles.length !== 4)
        return res.status(400).json({ error: "Requires EXACTLY 4 images" });

      mediaGroup = await Promise.all(
        imageFiles.map(async (file, i) => ({
          imageUrl: await uploadToS3(file, displayToValue),
          title: `Grid Item ${i + 1}`, // ⭐ AUTO TITLE
          description: `Description ${i + 1}`, // ⭐ AUTO DESCRIPTION
          metaTag: "",
          metaDescription: "",
          keywords: "",
          order: i + 1,
        }))
      );
    }

    // ============================================
    // 4️⃣ Women / Men 5-Grid (EXACT 5 images + metadata)
    // ============================================
    else if (["women-grid", "men-grid"].includes(displayToValue)) {
      if (!imageFiles || imageFiles.length !== 5)
        return res.status(400).json({ error: "Requires EXACTLY 5 images" });

      const arrTitles = JSON.parse(req.body.titles || "[]");
      const arrDescriptions = JSON.parse(req.body.descriptions || "[]");
      const arrMetaTags = JSON.parse(req.body.metaTags || "[]");
      const arrMetaDescriptions = JSON.parse(req.body.metaDescriptions || "[]");

      // keywords safe parse
      let arrKeywords = [];
      try {
        const parsed = JSON.parse(req.body.keywords || "[]");
        arrKeywords = Array.isArray(parsed) ? parsed : [];
      } catch {
        arrKeywords = [];
      }

      mediaGroup = await Promise.all(
        imageFiles.map(async (file, i) => ({
          imageUrl: await uploadToS3(file, displayToValue),
          title: arrTitles[i] || `Grid Item ${i + 1}`, // ⭐ auto fallback
          description: arrDescriptions[i] || `Description ${i + 1}`, // ⭐ auto fallback
          metaTag: arrMetaTags[i] || "",
          metaDescription: arrMetaDescriptions[i] || "",
          keywords: Array.isArray(arrKeywords[i])
            ? arrKeywords[i].join(",")
            : arrKeywords[i] || "",
          order: i + 1,
        }))
      );
    }

    // ============================================
    // 5️⃣ Blog Post (single image)
    // ============================================
    else if (displayToValue === "post") {
      if (!imageFiles || imageFiles.length !== 1)
        return res.status(400).json({ error: "Post requires 1 image" });

      const url = await uploadToS3(imageFiles[0], displayToValue);

      media = {
        url,
        name: imageFiles[0].originalname,
        kind: "image",
        displayTo: displayToValue,
      };
    }

    // ============================================
    // 6️⃣ Save to MongoDB
    // ============================================
    const saved = await CMSContent.create({
      title,
      description,
      displayTo: displayToValue,
      heroVideoUrl,
      media,
      mediaGroup,
      meta: {
        tag: metaTag,
        description: metaDescription,
        keywords: cleanKeywords, // FIXED
        visibleDate,
        visibleTime,
      },
      author: "Admin",
      status: "Pending Review",
    });

    res.json({ success: true, message: "Saved (Pending Review)", saved });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// ✅ Get All CMS (Admin Panel)
// =============================
router.get("/", async (req, res) => {
  try {
    const cmsContent = await CMSContent.find().sort({ createdAt: -1 });
    res.status(200).json(cmsContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================================
// ✅ GET SIMILAR PRODUCTS
// ==================================================
router.get("/similar/:id", async (req, res) => {
  try {
    const current = await Product.findById(req.params.id);
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const similar = await Product.find({
      _id: { $ne: current._id },
      category: current.category,
    })
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: similar.length,
      products: similar,
    });
  } catch (err) {
    console.error("Similar products error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// =============================
// ✅ Get Public CMS (Frontend)
// =============================
router.get("/public", async (req, res) => {
  try {
    const all = await CMSContent.find({ status: "Approved" });

    const response = {
      heroVideoUrl: null,
      menPageVideoUrl: null,
      womenPageVideoUrl: null,
      accessoriesVideoUrl: null,
      heritageVideoUrl: null,
      banners: {},
      men4Grid: [],
      women4Grid: [],
      menGrid: [],
      womenGrid: [],
      bannerCarousel: [],
      posts: [],
    };

    all.forEach((item) => {
      if (item.displayTo === "home-landing-video")
        response.heroVideoUrl = item.media?.url || item.heroVideoUrl;

      if (item.displayTo === "men-page-video")
        response.menPageVideoUrl = item.media?.url || item.heroVideoUrl;

      if (item.displayTo === "women-page-video")
        response.womenPageVideoUrl = item.media?.url || item.heroVideoUrl;

      if (item.displayTo === "accessories-video")
        response.accessoriesVideoUrl = item.media?.url || item.heroVideoUrl;

      if (item.displayTo === "heritage-video")
        response.heritageVideoUrl = item.media?.url || item.heroVideoUrl;

      if (item.displayTo === "bannerOne")
        response.banners.bannerOne = {
          image: item.media?.url,
          title: item.media?.title || item.title || "",
          description: item.media?.description || item.description || "",
        };

      if (item.displayTo === "bannerTwo")
        response.banners.bannerTwo = {
          image: item.media?.url,
          title: item.media?.title || item.title || "",
          description: item.media?.description || item.description || "",
        };

      if (item.displayTo === "women-4grid")
        response.women4Grid = item.mediaGroup.sort((a, b) => a.order - b.order);

      if (item.displayTo === "men-4grid")
        response.men4Grid = item.mediaGroup.sort((a, b) => a.order - b.order);

      if (item.displayTo === "women-grid")
        response.womenGrid = item.mediaGroup.sort((a, b) => a.order - b.order);

      if (item.displayTo === "men-grid")
        response.menGrid = item.mediaGroup.sort((a, b) => a.order - b.order);

      if (item.displayTo === "home-banner-carousel")
        response.bannerCarousel.push(...item.mediaGroup.map((m) => m.imageUrl));

      if (item.displayTo === "post")
        response.posts.push({
          title: item.title,
          description: item.description,
          media: item.media,
        });
    });

    return res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================
// ✅ Approve / Reject (Admin Only)
// =============================
router.patch("/approve/:id", async (req, res) => {
  try {
    const post = await CMSContent.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", updatedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    console.log("✅ Post Approved:", post._id);
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await CMSContent.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        rejectionReason: reason || "No reason provided",
        updatedAt: new Date(),
      },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    console.log("❌ Post Rejected:", post._id);
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
