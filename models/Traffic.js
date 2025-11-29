const mongoose = require("mongoose");

const trafficSchema = new mongoose.Schema(
  {
    ip: String,
    userAgent: String,
    country: { type: String, default: "Unknown" },
    region: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Traffic", trafficSchema);
