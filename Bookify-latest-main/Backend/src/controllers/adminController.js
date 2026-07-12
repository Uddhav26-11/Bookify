// Backend/src/controllers/adminController.js
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
    const completedOrders = await Order.countDocuments({
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    });

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // ---- Purchase Cost & Profit (built from REAL admin purchase price) ----
    // "Purchase cost" here always means Book.finalPrice — the amount the
    // admin actually paid the seller after approval/negotiation. It is
    // NEVER the seller's requested price (sellerProposedPrice) and never
    // the customer-facing selling price.
    const paidOrders = await Order.find({
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    })
      .select("bill.items")
      .populate("bill.items.book", "finalPrice sellerProposedPrice aiEstimatedPrice");

    let purchaseCost = 0;
    let totalProfit = 0;
    let profitableSales = 0;

    for (const order of paidOrders) {
      for (const item of order.bill?.items || []) {
        const book = item.book;
        if (!book) continue;
        // Real admin purchase price only — no fallback to seller's ask.
        const adminPurchasePrice = book.finalPrice || 0;
        const customerPrice = item.price || 0;
        purchaseCost += adminPurchasePrice;
        totalProfit += customerPrice - adminPurchasePrice;
        profitableSales += 1;
      }
    }

    const avgProfit = profitableSales > 0 ? Math.round((totalProfit / profitableSales) * 100) / 100 : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalSellers,
        totalCustomers,
        booksUploaded,
        pendingRequests,
        completedOrders,
        revenue: revenueAgg[0]?.total || 0,
        purchaseCost: Math.round(purchaseCost),
        totalProfit: Math.round(totalProfit),
        avgProfit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Analytics for the Overview page's charts — built only from real,
// completed (paid, non-cancelled) orders. No dummy/static numbers.
exports.getAnalytics = async (req, res) => {
  try {
    const monthlyAgg = await Order.aggregate([
      { $match: { paymentStatus: "Paid", orderStatus: { $ne: "Cancelled" } } },
      {
        $project: {
          totalAmount: 1,
          createdAt: 1,
          bookCount: { $size: { $ifNull: ["$books", []] } },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          booksSold: { $sum: "$bookCount" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const recent = monthlyAgg.slice(-12);

    const salesTrend = recent.map((m) => ({
      month: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
      booksSold: m.booksSold,
    }));

    const avgPriceTrend = recent.map((m) => ({
      month: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
      avgPrice: m.booksSold > 0 ? Math.round((m.revenue / m.booksSold) * 100) / 100 : 0,
    }));

    const totalBooksSold = monthlyAgg.reduce((sum, m) => sum + m.booksSold, 0);
    const totalRevenue = monthlyAgg.reduce((sum, m) => sum + m.revenue, 0);
    const avgSellingPrice = totalBooksSold > 0 ? Math.round((totalRevenue / totalBooksSold) * 100) / 100 : 0;

    let momChange = null;
    if (recent.length >= 2) {
      const prev = recent[recent.length - 2].booksSold;
      const curr = recent[recent.length - 1].booksSold;
      if (prev > 0) momChange = Math.round(((curr - prev) / prev) * 1000) / 10;
    }

    const pendingPickupRequests = await PickupRequest.countDocuments({
      status: { $nin: ["Completed", "Rejected"] },
    });
    const activeSellers = await User.countDocuments({ role: "seller" });
    const activeCustomers = await User.countDocuments({ role: "customer" });

    // ---- Profit trend (Customer Purchase Price - Admin Purchase Price) ----
    // Always uses Book.finalPrice (what admin actually paid the seller),
    // never sellerProposedPrice/aiEstimatedPrice, per each sold item.
    const paidOrdersForProfit = await Order.find({
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    })
      .select("bill.items createdAt")
      .populate("bill.items.book", "finalPrice");

    const profitByMonth = {};
    let totalProfit = 0;
    let totalPurchaseCost = 0;
    let profitableSales = 0;

    for (const order of paidOrdersForProfit) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!profitByMonth[key]) {
        profitByMonth[key] = {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          profit: 0,
          count: 0,
        };
      }
      for (const item of order.bill?.items || []) {
        const book = item.book;
        if (!book) continue;
        const adminPurchasePrice = book.finalPrice || 0;
        const customerPrice = item.price || 0;
        const profit = customerPrice - adminPurchasePrice;

        profitByMonth[key].profit += profit;
        profitByMonth[key].count += 1;
        totalProfit += profit;
        totalPurchaseCost += adminPurchasePrice;
        profitableSales += 1;
      }
    }

    const profitTrend = Object.values(profitByMonth)
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
      .slice(-12)
      .map((m) => ({
        month: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
        profit: Math.round(m.profit),
        avgProfit: m.count > 0 ? Math.round((m.profit / m.count) * 100) / 100 : 0,
        salesCount: m.count,
      }));

    const avgProfit = profitableSales > 0 ? Math.round((totalProfit / profitableSales) * 100) / 100 : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalBooksSold,
        totalRevenue,
        avgSellingPrice,
        momChange,
        pendingPickupRequests,
        activeSellers,
        activeCustomers,
        salesTrend,
        avgPriceTrend,
        // Profit analytics — always Customer Purchase Price - Admin Purchase Price
        totalProfit: Math.round(totalProfit),
        avgProfit,
        purchaseCost: Math.round(totalPurchaseCost),
        profitTrend,
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

    const booksBefore = pickup.books;

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

    await PickupRequest.updateMany({ books: bookId }, { status: "UnderVerification" });

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

exports.updateBookPrice = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { finalPrice } = req.body;
    const price = Number(finalPrice);

    const existing = await Book.findById(bookId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      { finalPrice: price, $push: { priceHistory: { price, changedBy: "admin" } } },
      { new: true }
    );

    return res.status(200).json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    await Book.findByIdAndDelete(bookId);
    return res.status(200).json({ success: true, message: "Book deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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