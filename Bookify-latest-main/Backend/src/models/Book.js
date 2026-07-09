const mongoose = require("mongoose");

// Generates a unique payment/tracking code
function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PMT-${rand}`;
}

const bookSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bookName: {
      type: String,
      required: true,
    },

    class: {
      type: String,
      default: "",
    },

    board: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "",
    },

    author: {
      type: String,
      default: "",
    },

    publication: {
      type: String,
      default: "",
    },

    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
    },

    images: [
      {
        type: String,
      },
    ],

    aiEstimatedPrice: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },

    sellerProposedPrice: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      default: 0,
    },

    // ---------------- ADMIN COUNTER-OFFER (price negotiation) ----------------
    // If the admin thinks the AI price is too low/high, they send the seller
    // a counter-offer price instead of just overriding it. The seller then
    // has to Accept (becomes finalPrice) or Reject it — nothing is finalized
    // without the seller's say-so.
    adminOfferedPrice: {
      type: Number,
      default: 0,
    },

    adminNote: {
      type: String,
      default: "",
    },

    priceApproval: {
      type: String,
      enum: ["NotRequired", "Pending", "Accepted", "Rejected"],
      default: "NotRequired",
    },

    trackingId: {
      type: String,
      unique: true,
      index: true,
      default: generateTrackingId,
    },

    priceHistory: [
      {
        price: Number,

        changedBy: {
          type: String,
          default: "admin",
        },

        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "Requested",
        "Assigned",
        "UnderVerification",
        "Approved",
        "Collected",
        "Paid",
        "Completed",
        "Rejected",
      ],
      default: "Requested",
    },

    // ---------------- PAYMENT ----------------

    paymentMode: {
      type: String,
      enum: ["", "Online", "Offline", "Stripe"],
      default: "",
    },

    // Stripe hosted receipt URL — set only when the seller was paid via Stripe.
    stripeReceiptUrl: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Waiting For Pickup",
        "Processing",
        "Paid",
      ],
      default: "Pending",
    },

    transactionId: {
      type: String,
      default: "",
    },

    paymentDate: {
      type: Date,
    },

    sellerMessage: {
      type: String,
      default: "",
    },

    paidBy: {
      type: String,
      default: "Admin",
    },

    // True once a customer has actually bought this book — keeps it from
    // still showing up in the "Buy Books" marketplace after it's sold.
    isSold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);