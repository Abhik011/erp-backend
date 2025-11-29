const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["cf-connecting-ip"] ||
      req.socket.remoteAddress ||
      "8.8.8.8";

    // External free GeoIP API
    const r = await axios.get(`https://ipapi.co/${ip}/json/`);

    res.json({
      success: true,
      countryCode: r.data?.country_code || "UN",
      country: r.data?.country_name || "Unknown",
    });
  } catch (err) {
    console.error("GeoIP error:", err?.message);

    res.json({
      success: true,
      countryCode: "UN",
      country: "Unknown",
    });
  }
});

module.exports = router;
