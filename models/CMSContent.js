const mongoose = require("mongoose");

const CMSContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    displayTo: {
      type: String,
      enum: [
        "",
        "post",
        "home-landing-video",
         "men-page-video",
    "women-page-video",
    "accessories-video",
    "heritage-video",
        "home-banner",
        "about-page",
        "product-page",
        "bannerOne",
        "bannerTwo",
        "bannerToggle",
        "home-banner-carousel",
        "women-grid",
        "men-grid",
        "women-4grid",
        "men-4grid",
      ],
      default: "",
    },

    media: {
      url: String,
      name: String,
      kind: String,
      displayTo: String,
    },

    meta: {
      tag: String,
      description: String,
      keywords: String, // SINGLE STRING ONLY
      visibleDate: String,
      visibleTime: String,
    },

    author: { type: String, default: "Admin" },

    status: {
      type: String,
      enum: ["Pending Review", "Approved", "Rejected", "Draft"],
      default: "Pending Review",
    },

    rejectionReason: String,
    heroVideoUrl: String,

    mediaGroup: [
      {
        imageUrl: String,
        title: String,
        description: String,
        metaTag: String,
        metaDescription: String,
        keywords: String,  // SINGLE STRING ONLY
        order: Number,
      },
    ],

    banners: [
      {
        imageUrl: String,
        order: Number,
      },
    ],

    stories: Array,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CMSContent", CMSContentSchema);
