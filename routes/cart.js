const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth"); // ✅ CORRECT PATH

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

// ✅ Cart Routes (User must be logged in)
router.get("/", auth(), getCart);
router.post("/add", auth(), addToCart);
router.put("/update", auth(), updateCartItem);
router.delete("/remove/:id", auth(), removeCartItem);
router.delete("/clear", auth(), clearCart);

module.exports = router;
