const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const path = require("path");
const Product = require("../models/product");

// ==================================================
// AWS CONFIG
// ==================================================
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/jpg",
  "image/heic"
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    console.warn(`⚠️ File rejected: ${file.originalname} (${file.mimetype})`);
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ==================================================
// MULTER CONFIG
// ==================================================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ==================================================
// SAFE JSON PARSER
// ==================================================
const safeJSON = (val, fallback = []) => {
  try {
    return JSON.parse(val || "[]");
  } catch {
    return fallback;
  }
};

// ==================================================
// HELPER → UPLOAD TO S3
// ==================================================
async function uploadToS3(file) {
  const fileName = `products/${crypto.randomBytes(8).toString("hex")}${path.extname(
    file.originalname
  )}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// ==================================================
// 🚀 BULK PRODUCT UPLOAD
// ==================================================
router.post("/upload/bulk", upload.array("images", 20), async (req, res) => {
  try {
    const parsedProducts = safeJSON(req.body.products, []);

    if (!parsedProducts.length)
      return res.status(400).json({ success: false, message: "No product data provided" });

    if (!req.files?.length)
      return res.status(400).json({ success: false, message: "No images uploaded" });

    const imageUrls = await Promise.all(req.files.map(uploadToS3));

    const saved = [];

    parsedProducts.forEach((p, index) => {
      saved.push(
        new Product({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          vendor: p.vendor,

          tags: p.tags || [],
          gender: p.gender || [],
          variants: p.variants || [],

          imageUrl: imageUrls[index] || imageUrls[0],
          gallery: imageUrls.slice(index * 2, index * 2 + 2),

          // NEW FIELDS
          notes: p.notes || "",
          terms: p.terms || "",
          materialDetails: p.materialDetails || "",
          careInstructions: p.careInstructions || "",
          highlights: p.highlights || "",

          specifications: p.specifications || {},
          faq: p.faq || [],
          customerPhotos: p.customerPhotos || [],

          uploadedBy: null,
        })
      );
    });

    await Product.insertMany(saved);

    return res.status(201).json({
      success: true,
      message: `Uploaded ${saved.length} products successfully`,
      products: saved,
    });

  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});



router.post("/upload", upload.fields([
  { name: "images", maxCount: 10 },
  { name: "customerPhotos", maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      vendor,
      tags,
      gender,
      variants,

      highlights,
      materialDetails,
      careInstructions,
      notes,
      terms,
      specifications,
      faq,

      existingGallery,
      existingCustomerPhotos,
      productId
    } = req.body;

    // Required fields
    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: "Missing name, category, or price" });
    }

    // Parse JSON fields
    const parseJSON = (str) => {
      try { return JSON.parse(str); } catch { return []; }
    };

    const parsedTags = parseJSON(tags);
    const parsedGender = parseJSON(gender);
    const parsedVariants = parseJSON(variants);
    const parsedSpecs = parseJSON(specifications);
    const parsedFaq = parseJSON(faq);
    const oldGallery = parseJSON(existingGallery);
    const oldCustomerPhotos = parseJSON(existingCustomerPhotos);

    // 1️⃣  Upload new images to S3
    let newGallery = [];
    if (req.files?.images) {
      newGallery = await Promise.all(req.files.images.map(uploadToS3));
    }

    // 2️⃣ Upload new customer photos
    let newCustPhotos = [];
    if (req.files?.customerPhotos) {
      newCustPhotos = await Promise.all(req.files.customerPhotos.map(uploadToS3));
    }

    // 3️⃣ Merge existing + new gallery images
    const finalGallery = [...oldGallery, ...newGallery];

    // 4️⃣ Merge existing + new customer photos
    const finalCustomerPhotos = [...oldCustomerPhotos, ...newCustPhotos];

    let product;

    // 5️⃣ EDIT MODE (productId exists)
    if (productId) {
      product = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          category,
          vendor,
          tags: parsedTags,
          gender: parsedGender,
          variants: parsedVariants,

          highlights,
          materialDetails,
          careInstructions,
          notes,
          terms,
          specifications: parsedSpecs,
          faq: parsedFaq,

          imageUrl: finalGallery[0] || "",
          gallery: finalGallery,
          customerPhotos: finalCustomerPhotos
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product
      });
    }

    // 6️⃣ CREATE MODE
    if (finalGallery.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image required" });
    }

    product = new Product({
      name,
      description,
      price,
      category,
      vendor,
      tags: parsedTags,
      gender: parsedGender,
      variants: parsedVariants,

      highlights,
      materialDetails,
      careInstructions,
      notes,
      terms,
      specifications: parsedSpecs,
      faq: parsedFaq,

      imageUrl: finalGallery[0],
      gallery: finalGallery,
      customerPhotos: finalCustomerPhotos,
      uploadedBy: null
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});



// ==================================================
// 🚀 GET ALL PRODUCTS
// ==================================================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ==================================================
// 🚀 GET SINGLE PRODUCT (FULL DETAILS)
// ==================================================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });

  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
