// routes/payments.js
const express = require("express");
const router = express.Router();
require("dotenv").config();

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const paypal = require("@paypal/checkout-server-sdk");

// PayPal environment (sandbox/production)
function paypalClient() {
  const env =
    process.env.PAYPAL_MODE === "production"
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  return new paypal.core.PayPalHttpClient(env);
}

// Mongoose Order model - adjust schema to your app
const Order = require("../models/Order"); // <- implement your schema

// -------------------- Create Stripe Checkout Session --------------------
router.post("/create-stripe-session", async (req, res) => {
  try {
    const { items, customerEmail, address } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "No items provided" });

    // Build line_items expected by Stripe
    const line_items = items.map((it) => ({
      price_data: {
        currency: "usd", // change if needed
        product_data: {
          name: it.name,
          images: it.images || [], // optional
        },
        unit_amount: Math.round(Number(it.price) * 100),
      },
      quantity: Number(it.qty || 1),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/payment/cancel`,
      metadata: {
        // you can encode order preview here
        source: "kzarre-web",
      },
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ["US", "IN", "GB", "CA"] }, // adjust
    });

    // create pending order in DB
    const order = await Order.create({
      items,
      total: items.reduce((s, i) => s + i.price * (i.qty || 1), 0),
      status: "pending",
      paymentMethod: "stripe",
      stripeSessionId: session.id,
      customerEmail,
      shippingAddress: address || null,
    });

    res.json({ sessionId: session.id, orderId: order._id });
  } catch (err) {
    console.error("create-stripe-session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Stripe webhook to confirm payment --------------------
router.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      // find order by sessionId and mark paid
      const order = await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "paid",
          paymentConfirmedAt: new Date(),
          paymentDetails: session,
        },
        { new: true }
      );
      console.log("Stripe session completed, order updated:", order?._id);
    } catch (err) {
      console.error("Failed to update order after stripe webhook:", err);
    }
  }

  res.json({ received: true });
});

// -------------------- PayPal: create order (server side) --------------------
router.post("/paypal/create-order", async (req, res) => {
  try {
    const { items, returnUrl, cancelUrl, customerEmail, address } = req.body;
    const client = paypalClient();

    const purchase_units = [
      {
        amount: {
          currency_code: "USD",
          value: (items.reduce((s, it) => s + it.price * (it.qty || 1), 0)).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: (items.reduce((s, it) => s + it.price * (it.qty || 1), 0)).toFixed(2),
            },
          },
        },
        items: items.map((it) => ({
          name: it.name,
          sku: it.sku || "sku",
          unit_amount: { currency_code: "USD", value: Number(it.price).toFixed(2) },
          quantity: String(it.qty || 1),
        })),
      },
    ];

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units,
      application_context: {
        brand_name: "KZARRE",
        return_url: returnUrl || `${process.env.FRONTEND_BASE_URL}/payment/paypal-success`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_BASE_URL}/payment/cancel`,
      },
    });

    const createOrderResponse = await client.execute(request);

    // create pending order record in DB
    const order = await Order.create({
      items,
      total: items.reduce((s, i) => s + i.price * (i.qty || 1), 0),
      status: "pending",
      paymentMethod: "paypal",
      paypalOrderId: createOrderResponse.result.id,
      customerEmail,
      shippingAddress: address || null,
    });

    // find approval link
    const approval = createOrderResponse.result.links.find((l) => l.rel === "approve");
    return res.json({ orderID: createOrderResponse.result.id, approvalUrl: approval.href, orderId: order._id });
  } catch (err) {
    console.error("paypal create-order error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- PayPal capture webhook or capture route --------------------
// Option 1: let frontend call capture after user approves: POST /api/payments/paypal/capture
router.post("/paypal/capture", async (req, res) => {
  try {
    const { orderID } = req.body;
    const client = paypalClient();

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client.execute(request);

    // Update DB order by paypalOrderId -> paid
    await Order.findOneAndUpdate(
      { paypalOrderId: orderID },
      { status: "paid", paymentDetails: capture.result, paymentConfirmedAt: new Date() }
    );

    res.json({ success: true, capture });
  } catch (err) {
    console.error("paypal capture error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
