const express = require("express");
const router = express.Router();
const controller = require("../controllers/analyticsController");

// SUMMARY
router.get("/summary", controller.getSummary);

// TRAFFIC
router.get("/traffic/daily", controller.getDailyTraffic);
router.get("/traffic/hourly", controller.getHourlyTraffic);
router.get("/traffic/country", controller.countryTraffic);
router.get("/traffic/region", controller.regionTraffic);
router.get("/traffic/devices", controller.deviceTraffic);

// USERS / CONVERSION
router.get("/conversion-rate", controller.conversionRate);
router.get("/repeat-customers", controller.repeatCustomers);

// ORDERS
router.get("/orders/daily", controller.dailyOrders);
router.get("/top-products", controller.topProducts);
router.get("/category-sales", controller.categorySales);

module.exports = router;
