const User = require("../models/User");
const Book = require("../models/Book");
const Order = require("../models/Order");
const PickupRequest = require("../models/PickupRequest");
const stripe = require("../config/stripe");
const { sendNotification, sendBulkNotification, notifySafely } = require("../services/notificationService");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const booksUploaded = await Book.countDocuments();
    const pendingRequests = await PickupRequest.countDocuments({
      status: { $nin: ["Completed", "Rejected"] },
    });
    // "Completed Orders" = successfully paid orders (the sale itself is
    // done), not necessarily physically delivered yet — delivery status is
    // tracked separately via orderStatus. This mirrors how Revenue below is
    // computed, so the two numbers stay consistent with each other instead
    // of Revenue counting orders that "Completed Orders" doesn't.
    const completedOrders = await Order.countDocuments({
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    });

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalSellers,
        totalCustomers,
        booksUploaded,
        pendingRequests,
        completedOrders,
        revenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch all pickup requests with seller info + book details (incl. images)
exports.getAllPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find()
      .populate("seller", "name email phone address city pincode bankDetails")
      .populate("books")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, pickups });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update pickup status (Approve / Reject / Assigned / Collected / Paid / Completed)
exports.updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, finalPrices } = req.body; // finalPrices = { bookId: price }

    const pickup = await PickupRequest.findById(id).populate("books");
    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup request not found" });
    }

    const booksBefore = pickup.books; // snapshot with pre-update prices, for notification messages

    pickup.status = status;
    await pickup.save();

    await Book.updateMany({ _id: { $in: pickup.books } }, { status });

    if (finalPrices && typeof finalPrices === "object") {
      for (const bookId of Object.keys(finalPrices)) {
        const price = Number(finalPrices[bookId]);
        await Book.findByIdAndUpdate(bookId, {
          finalPrice: price,
          $push: { priceHistory: { price, changedBy: "admin" } },
        });

        notifySafely(async () => {
          const book = booksBefore.find((b) => String(b._id) === String(bookId));
          if (!book) return;
          await sendNotification({
            receiver: pickup.seller,
            receiverRole: "seller",
            sender: "admin",
            senderName: "Admin",
            title: "Price Updated",
            message: `Admin updated price for "${book.bookName}" from ₹${book.finalPrice || book.aiEstimatedPrice || 0} to ₹${price}.`,
            type: "PRICE_UPDATED",
            referenceId: bookId,
          });
        });
      }
    }

    if (status === "Approved") {
      notifySafely(async () => {
        await Promise.all(
          booksBefore.map((book) =>
            sendNotification({
              receiver: pickup.seller,
              receiverRole: "seller",
              sender: "admin",
              senderName: "Admin",
              title: "Book Approved",
              message: `Your book "${book.bookName}" is now live.`,
              type: "BOOK_APPROVED",
              referenceId: book._id,
            })
          )
        );
      });
    } else if (status === "Rejected") {
      notifySafely(async () => {
        await Promise.all(
          booksBefore.map((book) =>
            sendNotification({
              receiver: pickup.seller,
              receiverRole: "seller",
              sender: "admin",
              senderName: "Admin",
              title: "Book Rejected",
              message: `Your book "${book.bookName}" was rejected.`,
              type: "BOOK_REJECTED",
              referenceId: book._id,
            })
          )
        );
      });
    }

    const updated = await PickupRequest.findById(id)
      .populate("seller", "name email phone address city pincode bankDetails")
      .populate("books");

    return res.status(200).json({ success: true, pickup: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignPickupExecutive = async (req, res) => {
  try {
    const { pickupId, executiveName, executivePhone } = req.body;
    const pickup = await PickupRequest.findByIdAndUpdate(
      pickupId,
      { executiveName, executivePhone, status: "Assigned" },
      { new: true }
    ).populate("seller", "name email phone address city pincode bankDetails").populate("books");
    return res.status(200).json({ success: true, pickup });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin marks a pickup as PAID — "Online" (needs a transaction/UTR reference,
// e.g. from a UPI/bank transfer they just made using the seller's bank
// details), "Offline" (cash handed over, e.g. by the pickup executive), or
// "Stripe" (admin settles the amount via Stripe — creates a real Stripe
// test-mode payment as proof of the payout; see createStripePayoutRecord).
exports.payPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, transactionId } = req.body;

    if (!["Online", "Offline", "Stripe"].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: "paymentMode must be 'Online', 'Offline' or 'Stripe'" });
    }
    if (paymentMode === "Online" && !transactionId) {
      return res.status(400).json({ success: false, message: "Transaction/reference ID is required for online payment" });
    }

    const pickup = await PickupRequest.findById(id).populate("books");
    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup request not found" });
    }

    let txnNote = transactionId;
    let stripeReceiptUrl = "";

    if (paymentMode === "Offline") {
      txnNote = transactionId || "Cash handover";
    } else if (paymentMode === "Stripe") {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ success: false, message: "Stripe is not configured on the server (missing STRIPE_SECRET_KEY)." });
      }

      const amount = pickup.books.reduce(
        (sum, b) => sum + (b.finalPrice || b.aiEstimatedPrice || 0),
        0
      );
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Could not determine a valid payout amount for this pickup." });
      }

      try {
        // NOTE: This project doesn't use Stripe Connect (sellers don't have
        // their own Stripe accounts), so this doesn't move real money into
        // the seller's bank account. It creates a real Stripe payment in
        // test mode using Stripe's built-in test card token, which gives the
        // admin a genuine Stripe transaction ID + receipt as proof of the
        // payout for record-keeping.
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "inr",
          payment_method: "pm_card_visa",
          payment_method_types: ["card"],
          confirm: true,
          description: `Bookify seller payout — pickup ${pickup.trackingId}`,
          metadata: {
            pickupId: String(pickup._id),
            sellerId: String(pickup.seller),
            trackingId: pickup.trackingId,
          },
        });

        txnNote = paymentIntent.id;

        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          stripeReceiptUrl = charge?.receipt_url || "";
        }
      } catch (stripeErr) {
        console.error("Stripe payout error:", stripeErr.raw || stripeErr);
        return res.status(500).json({ success: false, message: stripeErr.message || "Stripe payment failed" });
      }
    }

    const paidAt = new Date();

    pickup.status = "Paid";
    pickup.paymentMode = paymentMode;
    pickup.transactionId = txnNote;
    pickup.stripeReceiptUrl = stripeReceiptUrl;
    pickup.paidAt = paidAt;
    await pickup.save();

    await Book.updateMany(
      { _id: { $in: pickup.books } },
      { status: "Paid", paymentMode, transactionId: txnNote, stripeReceiptUrl, paymentDate: paidAt }
    );

    const updated = await PickupRequest.findById(id)
      .populate("seller", "name email phone address city pincode bankDetails")
      .populate("books");

    notifySafely(async () => {
      // Let the seller know they've been paid.
      await Promise.all(
        (updated.books || []).map((book) =>
          sendNotification({
            receiver: updated.seller._id,
            receiverRole: "seller",
            sender: "admin",
            senderName: "Admin",
            title: "Payment Completed",
            message: `You've been paid ₹${book.finalPrice || book.aiEstimatedPrice || 0} for "${book.bookName}".`,
            type: "PAYMENT_DONE",
            referenceId: book._id,
          })
        )
      );

      // Books become visible in the marketplace once paid (see
      // getAllBooks marketplace filter) — announce them to every customer.
      const customers = await User.find({ role: "customer" }).select("_id");
      const customerIds = customers.map((c) => c._id);

      await Promise.all(
        (updated.books || []).map((book) =>
          sendBulkNotification(customerIds, "customer", {
            sender: "admin",
            senderName: "Admin",
            title: "New Book Available",
            message: `"${book.bookName}" is now available.`,
            type: "NEW_BOOK",
            referenceId: book._id,
          })
        )
      );
    });

    return res.status(200).json({ success: true, message: `Marked as paid (${paymentMode})`, pickup: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin thinks the AI price is too low/high for a book — instead of
// silently overriding it, send the seller a counter-offer price (+ optional
// note explaining why) and wait for the seller to Accept or Reject it.
exports.sendCounterOffer = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { price, note } = req.body;
    const offeredPrice = Number(price);

    if (!offeredPrice || offeredPrice <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid counter-offer price." });
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      {
        adminOfferedPrice: offeredPrice,
        adminNote: note || "",
        priceApproval: "Pending",
        status: "UnderVerification",
      },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Reflect on the parent pickup request too so it shows up as awaiting
    // action instead of sitting in "Requested".
    await PickupRequest.updateMany({ books: bookId }, { status: "UnderVerification" });

    notifySafely(() =>
      sendNotification({
        receiver: book.seller,
        receiverRole: "seller",
        sender: "admin",
        senderName: "Admin",
        title: "Price Offer Sent",
        message: `Admin sent a counter-offer of ₹${offeredPrice} for "${book.bookName}".${note ? ` Note: ${note}` : ""}`,
        type: "PRICE_UPDATED",
        referenceId: book._id,
      })
    );

    return res.status(200).json({ success: true, message: "Counter-offer sent to seller", book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update inventory selling price directly (admin can edit price on dashboard)
exports.updateBookPrice = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { finalPrice } = req.body;
    const price = Number(finalPrice);

    const existing = await Book.findById(bookId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    const oldPrice = existing.finalPrice || existing.aiEstimatedPrice || 0;

    const book = await Book.findByIdAndUpdate(
      bookId,
      { finalPrice: price, $push: { priceHistory: { price, changedBy: "admin" } } },
      { new: true }
    );

    notifySafely(() =>
      sendNotification({
        receiver: book.seller,
        receiverRole: "seller",
        sender: "admin",
        senderName: "Admin",
        title: "Price Updated",
        message: `Admin updated price for "${book.bookName}" from ₹${oldPrice} to ₹${price}.`,
        type: "PRICE_UPDATED",
        referenceId: book._id,
      })
    );

    return res.status(200).json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin updates the delivery/order status of a customer order and can
// leave a note — this is what powers the customer-facing tracking timeline.
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, note, expectedDeliveryDate } = req.body;

    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (expectedDeliveryDate) update.expectedDeliveryDate = expectedDeliveryDate;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        ...update,
        $push: { statusHistory: { status: orderStatus, note: note || "" } },
      },
      { new: true }
    ).populate("books");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    notifySafely(() => {
      const statusMessages = {
        Confirmed: { title: "Order Accepted", message: "Your order has been confirmed.", type: "ORDER_ACCEPTED" },
        Cancelled: { title: "Order Cancelled", message: "Your order has been cancelled.", type: "ORDER_CANCELLED" },
        Shipped: { title: "Order Shipped", message: "Your order has been shipped.", type: "ORDER_UPDATE" },
        "Out for Delivery": { title: "Out for Delivery", message: "Your order is out for delivery.", type: "ORDER_UPDATE" },
        Delivered: { title: "Order Delivered", message: "Your order has been delivered.", type: "ORDER_UPDATE" },
      };
      const info = statusMessages[orderStatus];
      if (!info) return Promise.resolve();

      return sendNotification({
        receiver: order.customer,
        receiverRole: "customer",
        sender: "admin",
        senderName: "Admin",
        title: info.title,
        message: info.message,
        type: info.type,
        referenceId: order._id,
      });
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// All customer orders, for the admin to see and manage delivery tracking.
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("books")
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Permanently remove an order (e.g. test/junk orders, or ones left behind
// by an abandoned/duplicate Stripe checkout whose linked customer or books
// no longer exist). Does not touch the linked books/customer themselves.
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a book from inventory
exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    await Book.findByIdAndDelete(bookId);
    return res.status(200).json({ success: true, message: "Book deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a pickup request entirely, along with any books still attached to
// it. Previously there was no route that actually removed the
// PickupRequest document itself — the frontend's "Delete" button could
// only delete the attached books and flip status to "Rejected", so an
// already-Rejected request with no books left (nothing to delete, already
// the target status) would just sit there forever looking un-deletable.
exports.deletePickupRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await PickupRequest.findById(id);
    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup request not found" });
    }

    if (pickup.books?.length) {
      await Book.deleteMany({ _id: { $in: pickup.books } });
    }
    await PickupRequest.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Pickup request deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};