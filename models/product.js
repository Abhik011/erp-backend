const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ============================================
    // BASIC PRODUCT INFO
    // ============================================
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },

    discountPrice: { type: Number, default: 0 },

    imageUrl: { type: String, required: true },
    gallery: [{ type: String }], // Multiple S3 URLs

    tags: [{ type: String, trim: true }],
    gender: [{ type: String, enum: ["Men", "Women", "Unisex"] }],

    vendor: { type: String, trim: true },

    inStock: { type: Boolean, default: true },

    stockQuantity: { type: Number, default: 0 },

    valuation: { type: Number, default: 0 },

    // ============================================
    // VARIANTS
    // ============================================
    variants: [
      {
        size: String,
        color: String,
        material: String,
        price: Number,
        stock: Number,
      },
    ],

    // ============================================
    // NEW FIELDS ADDED
    // ============================================

    notes: { type: String, default: "" },

    terms: { type: String, default: "" },

    materialDetails: { type: String, default: "" },

    careInstructions: { type: String, default: "" },

    highlights: { type: String, default: "" },

    specifications: {
      material: String,
      fit: String,
      washCare: String,
      pattern: String,
      origin: String,
      brand: String,
      others: String,
    },

    faq: [
      {
        question: String,
        answer: String,
      },
    ],

    customerPhotos: [{ type: String }],

    // ============================================
    // SYSTEM
    // ============================================
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    sku: {
      type: String,
      unique: true,
      default: function () {
        return `KZR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      },
    },
  },
  { timestamps: true }
);

// ======================================================
// AUTO-CALCULATIONS BEFORE SAVE
// ======================================================
productSchema.pre("save", function (next) {
  // Calculate total stock from variants
  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.stockQuantity = this.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );
  }

  // Update inStock status
  this.inStock = this.stockQuantity > 0;

  // Calculate valuation using discount price if available
  const basePrice = this.discountPrice > 0 ? this.discountPrice : this.price;
  this.valuation = (basePrice || 0) * (this.stockQuantity || 0);

  next();
});

// ======================================================
// AUTO-CALCULATE DURING findOneAndUpdate
// ======================================================
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (
    update.price !== undefined ||
    update.discountPrice !== undefined ||
    update.stockQuantity !== undefined
  ) {
    const basePrice =
      update.discountPrice > 0 ? update.discountPrice : update.price;

    const stockQty = update.stockQuantity ?? 0;

    update.valuation = (basePrice || 0) * stockQty;
  }

  next();
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
