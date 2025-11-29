const express = require("express");
const router = express.Router();
const Traffic = require("../models/Traffic");
let geoip = null;
let UAParser = null;

try { geoip = require("geoip-lite"); } catch {}
try { UAParser = require("ua-parser-js"); } catch {}

router.post("/", async (req, res) => {
  try {
    const { visitorId, userId, url, userAgent, publicIP } = req.body;

    if (!visitorId) {
      return res.status(400).json({ success: false, message: "visitorId required" });
    }

    // 🔥 Use public IP if available (local dev)
    const ip =
      publicIP ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["cf-connecting-ip"] ||
      req.socket.remoteAddress ||
      null;

    const doc = {
      visitorId,
      userId,
      url,
      ip,
      userAgent: userAgent || req.headers["user-agent"] || "Unknown",
    };

    // First-time visitor check
    const exists = await Traffic.findOne({ visitorId });
    doc.isFirstTime = !exists;

    // 🔥 GEO LOOKUP
    if (geoip && ip) {
      const geo = geoip.lookup(ip);
      if (geo) {
        doc.country = geo.country || "UN";
        doc.region = geo.region || "Unknown";
        doc.city = geo.city || "Unknown";
      }
    }

    // UA Parsing
    if (UAParser) {
      const parser = new UAParser(doc.userAgent);
      const device = parser.getDevice();
      const os = parser.getOS();
      const browser = parser.getBrowser();

      doc.deviceType = device.type || "desktop";
      doc.os = os.name || null;
      doc.browser = browser.name || null;
    }

    await Traffic.create(doc);

    res.json({ success: true });
  } catch (err) {
    console.error("🔥 Error saving traffic:", err);
    res.status(500).json({ success: false, message: "Tracking failed" });
  }
});

module.exports = router;
