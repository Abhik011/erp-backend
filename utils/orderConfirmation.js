module.exports.orderConfirmationTemplate = (orderId, items, address, totalAmount) => {
  return `
  <div style="font-family: 'Arial', sans-serif; padding:20px; background:#f6f6f6;">
    <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

      <h2 style="text-align:center; color:#111;">Thank You For Your Order!</h2>
      <p style="font-size:16px; color:#444;">Hi <strong>${address.name}</strong>,</p>

      <p>Your Cash on Delivery order has been confirmed.</p>

      <div style="margin-top:20px;">
        <h3 style="color:#111;">🧾 Order Details</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
      </div>

      <div style="margin-top:20px;">
        <h3 style="color:#111;">📦 Items</h3>
        <ul style="padding-left:16px;">
          ${items.map(it => `
            <li style="margin-bottom:6px;">${it.qty} × ${it.name || "Product"} — $${it.price}</li>
          `).join("")}
        </ul>
      </div>

      <div style="margin-top:20px;">
        <h3 style="color:#111;">🚚 Delivery Address</h3>
        <p>${address.line1}, ${address.city}, ${address.state} - ${address.pincode}</p>
        <p><strong>Phone:</strong> ${address.phone}</p>
      </div>

      <p style="margin-top:28px; font-size:15px; color:#777;">We will notify you when your order is shipped.</p>

      <p style="text-align:center; margin-top:25px; color:#999;">© KZARRÈ</p>
    </div>
  </div>
  `;
};
