const mongoose = require("mongoose");

// Generates a human-friendly, unique tracking number for an order,
// e.g. "BKF-M9X2K7-4F3A". Used by the customer to track delivery
// and by support/admin to look up the order quickly.
function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  return `BKF-${time}-${rand}`;
}

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    totalAmount: { type: Number, required: true },
    address: { type: String, required: true },
    paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    orderStatus: {
      type: String,
      enum: ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Placed",
    },
    // Unique code the customer / support can use to track this order's delivery.
    trackingId: { type: String, unique: true, index: true, default: generateTrackingId },
    // Timeline of status changes, shown on the customer tracking page.
    statusHistory: [
      {
        status: { type: String },
        note: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],
    // Snapshot of the bill at the time of purchase, so it stays accurate
    // even if book prices change later.
    bill: {
      items: [
        {
          book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
          title: { type: String },
          price: { type: Number },
          qty: { type: Number },
        },
      ],
      subtotal: { type: Number },
      deliveryFee: { type: Number },
      total: { type: Number },
    },
    stripeSessionId: { type: String, unique: true, sparse: true, index: true },
    expectedDeliveryDate: { type: Date },
  },
  { timestamps: true }
);

orderSchema.statics.generateTrackingId = generateTrackingId;

module.exports = mongoose.model("Order", orderSchema);