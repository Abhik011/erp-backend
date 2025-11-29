const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/product");

/*
|--------------------------------------------------------------------------
| ⭐ CREATE ORDER BEFORE PAYMENT (Checkout Step)
|       POST /api/checkout/create-order
|--------------------------------------------------------------------------
*/
router.post("/create-order", async (req, res) => {
  try {
    const { userId, productId, qty, size, color, address } = req.body;

    if (!productId || !qty || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    // 1️⃣ Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let variant = null;

    // 2️⃣ Variant product
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      
      variant = product.variants.find(
        (v) =>
          v.size === size &&
          (color ? v.color === color : true)
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: "Selected size/color not available",
        });
      }

      // 3️⃣ Check variant stock
      if (variant.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} items left in stock`,
        });
      }

      // Reduce variant stock
      variant.stock -= qty;

      // Update total stock
      product.stockQuantity = product.variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );

    } else {
      // 2️⃣ Simple product
      if ((product.stockQuantity || 0) < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} items left`,
        });
      }

      product.stockQuantity = (product.stockQuantity || 0) - qty;
    }

    // 6️⃣ Save product
    await product.save();

    // 7️⃣ Calculate totals
    const subtotal = product.price * qty;
    const deliveryFee = 15;
    const totalAmount = subtotal + deliveryFee;

    // Generate order ID
    const generatedOrderId =
      "ORD-" + Math.floor(100000 + Math.random() * 900000);

    // 8️⃣ Create order
    const order = await Order.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,

      items: [
        {
          product: productId,
          qty,
          price: product.price,

          // ⭐ Fully Dynamic Product Export
          name: product.name,
          image: product.imageUrl,

          // ⭐ Variant Details
          size: size || "",
          color: color || "",

          // ⭐ NEW FIELDS (for premium shipping label)
          sku: product.sku || "N/A",
          barcode: variant?.barcode || product.sku || "N/A",
        },
      ],

      address,
      amount: totalAmount,
      paymentMethod: "COD",
      paymentId: null,
      orderId: generatedOrderId,
      status: "pending",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      orderId: generatedOrderId,
      order,
    });

  } catch (err) {
    console.error("create-order error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
});




/*
|--------------------------------------------------------------------------
| ⭐ GET ORDER BY READABLE ORDER ID
|       GET /api/checkout/order/:orderId
|--------------------------------------------------------------------------
*/
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find by readable ID, not _id
    const order = await Order.findOne({ orderId }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
