const mongoose = require("mongoose");

function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PU-${rand}`;
}

const pickupRequestSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    // Tracking code the seller can use to track this pickup/payment request.
    trackingId: { type: String, unique: true, index: true, default: generateTrackingId },
    executiveName: { type: String },
    executivePhone: { type: String },
    scheduledDate: { type: Date },
    status: {
      type: String,
      enum: ["Requested", "Assigned", "UnderVerification", "Approved", "Collected", "Paid", "Completed", "Rejected"],
      default: "Requested",
    },
    paymentMethod: { type: String, enum: ["Instant", "Credit24h"] },
    // How the admin actually paid the seller, and proof of it.
    paymentMode: { type: String, enum: ["Online", "Offline", "Stripe"] },
    transactionId: { type: String }, // required for Online, optional/"Cash" note for Offline, Stripe PaymentIntent id for Stripe
    // Stripe hosted receipt URL — set only when paymentMode is "Stripe", so the
    // admin/seller can open the real Stripe receipt as proof of payment.
    stripeReceiptUrl: { type: String, default: "" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PickupRequest", pickupRequestSchema);