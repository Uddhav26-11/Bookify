const mongoose = require("mongoose");

// receiver / sender are stored as plain strings (not ObjectId refs) because
// the "admin" account is a virtual user (id === "admin", not a Mongo
// document) — see authController.login. Storing plain strings lets a single
// schema handle admin, seller, and customer receivers/senders uniformly.
const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type: String,
      required: true,
      index: true,
    },

    receiverRole: {
      type: String,
      enum: ["admin", "seller", "customer"],
    },

    sender: {
      type: String,
      default: null,
    },

    senderName: {
      type: String,
      default: "",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Not a hard enum on purpose — keeps the notification system easy to
    // extend with new event types without a migration. Common values:
    // BOOK_REQUEST, BOOK_APPROVED, BOOK_REJECTED, NEW_BOOK,
    // ORDER_ACCEPTED, ORDER_CANCELLED, ORDER_UPDATE,
    // NEW_SELLER, NEW_CUSTOMER, PAYMENT_ISSUE, PAYMENT_DONE
    type: {
      type: String,
      required: true,
    },

    // Id of the related document (book, order, pickup...) so the frontend
    // can deep-link to it if needed.
    referenceId: {
      type: String,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast "latest notifications for this user" queries.
notificationSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
