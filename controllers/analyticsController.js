const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Traffic = require("../models/Traffic");
const Product = require("../models/product");

// Optional libs
let geoip = null;
let UAParser = null;
try { geoip = require("geoip-lite"); } catch {}
try { UAParser = require("ua-parser-js"); } catch {}

// Enrich doc (IP → country/region, userAgent → device)
async function enrichTraffic(ip, userAgent) {
  const data = { ip, userAgent };

  if (geoip) {
    const g = geoip.lookup(ip || "");
    if (g) {
      data.country = g.country || "Unknown";
      data.region = g.region || "Unknown";
      data.city = g.city || "Unknown";
    }
  }

  if (UAParser) {
    const parser = new UAParser(userAgent || "");
    const device = parser.getDevice()?.type;

    data.deviceType =
      device === "mobile" ? "mobile" :
      device === "tablet" ? "tablet" : "desktop";

    data.os = parser.getOS().name || null;
    data.browser = parser.getBrowser().name || null;
  }

  return data;
}

/* ============================================================
   EXPORT ALL CONTROLLER FUNCTIONS
   ============================================================ */

module.exports = {
  // -----------------------------
  // SUMMARY
  // -----------------------------
  async getSummary(req, res) {
    try {
      const totalOrders = await Order.countDocuments();
      const totalUsers = await Customer.countDocuments();

      const rev = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);

      const newUsers = await Customer.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      res.json({
        success: true,
        summary: {
          totalOrders,
          totalUsers,
          newUsers,
          totalRevenue: rev[0]?.total || 0,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Summary failed" });
    }
  },

  // -----------------------------
  // DAILY TRAFFIC
  // -----------------------------
  async getDailyTraffic(req, res) {
    try {
      const data = await Traffic.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            visits: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      res.json({ success: true, traffic: data });
    } catch {
      res.status(500).json({ success: false, message: "Daily traffic failed" });
    }
  },

  // -----------------------------
  // HOURLY TRAFFIC
  // -----------------------------
  async getHourlyTraffic(req, res) {
    try {
      const agg = await Traffic.aggregate([
        { $group: { _id: { $hour: "$createdAt" }, visits: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      const fixed = Array.from({ length: 24 }).map((_, i) => ({
        hour: i,
        visits: agg.find((x) => x._id === i)?.visits || 0,
      }));

      res.json({ success: true, data: fixed });
    } catch {
      res.status(500).json({ success: false, message: "Hourly failed" });
    }
  },

  // -----------------------------
  // COUNTRY-WISE TRAFFIC
  // -----------------------------
  async countryTraffic(req, res) {
    try {
      const data = await Traffic.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$country", "Unknown"] },
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
      ]);

      res.json({ success: true, countries: data });
    } catch {
      res.status(500).json({ success: false, message: "Country traffic failed" });
    }
  },

  // -----------------------------
  // REGION-WISE TRAFFIC
  // -----------------------------
  async regionTraffic(req, res) {
    try {
      const data = await Traffic.aggregate([
        {
          $group: {
            _id: {
              country: { $ifNull: ["$country", "Unknown"] },
              region: { $ifNull: ["$region", "Unknown"] },
            },
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
      ]);
      res.json({ success: true, regions: data });
    } catch {
      res.status(500).json({ success: false, message: "Region traffic failed" });
    }
  },

  // -----------------------------
  // DEVICE ANALYTICS
  // -----------------------------
  async deviceTraffic(req, res) {
    try {
      const data = await Traffic.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$deviceType", "unknown"] },
            visits: { $sum: 1 },
          },
        },
      ]);
      res.json({ success: true, devices: data });
    } catch {
      res.status(500).json({ success: false, message: "Device traffic failed" });
    }
  },

  // -----------------------------
  // CONVERSION RATE
  // -----------------------------
  async conversionRate(req, res) {
    try {
      const visitors = await Traffic.countDocuments();
      const orders = await Order.countDocuments();
      const rate = visitors ? (orders / visitors) * 100 : 0;

      res.json({
        success: true,
        visitors,
        orders,
        conversionRate: Number(rate.toFixed(2)),
      });
    } catch {
      res.status(500).json({ success: false, message: "Conversion failed" });
    }
  },

  // -----------------------------
  // REPEAT CUSTOMERS
  // -----------------------------
  async repeatCustomers(req, res) {
    try {
      const data = await Order.aggregate([
        { $group: { _id: "$customerId", orders: { $sum: 1 } } },
        { $match: { orders: { $gte: 2 } } },
      ]);

      res.json({ success: true, repeatCustomers: data.length });
    } catch {
      res.status(500).json({ success: false, message: "Repeat failed" });
    }
  },

  // -----------------------------
  // DAILY ORDERS
  // -----------------------------
  async dailyOrders(req, res) {
    try {
      const data = await Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      res.json({ success: true, orders: data });
    } catch {
      res.status(500).json({ success: false, message: "Daily orders failed" });
    }
  },

  // -----------------------------
  // TOP PRODUCTS
  // -----------------------------
  async topProducts(req, res) {
    try {
      const data = await Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            sold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            sold: 1,
            name: "$product.name",
            category: "$product.category",
          },
        },
      ]);

      res.json({ success: true, products: data });
    } catch {
      res.status(500).json({ success: false, message: "Top products failed" });
    }
  },

  // -----------------------------
  // CATEGORY SALES
  // -----------------------------
  async categorySales(req, res) {
    try {
      const data = await Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            total: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.price" },
          },
        },
        { $sort: { total: -1 } },
      ]);

      res.json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, message: "Category sales failed" });
    }
  },
};
