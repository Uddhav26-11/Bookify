const Order = require("../models/Order");
const Book = require("../models/Book");
const { sendNotification, notifySafely } = require("../services/notificationService");

exports.placeOrder = async (req, res) => {
  try {
    const { books, totalAmount, address } = req.body;

    const order = await Order.create({
      customer: req.user.id,
      books,
      totalAmount,
      address,
    });

    notifySafely(async () => {
      const orderedBooks = await Book.find({ _id: { $in: books } }).select("seller bookName");
      const bySeller = new Map();
      orderedBooks.forEach((b) => {
        if (!bySeller.has(String(b.seller))) bySeller.set(String(b.seller), []);
        bySeller.get(String(b.seller)).push(b.bookName);
      });

      await Promise.all(
        [...bySeller.entries()].map(([sellerId, titles]) =>
          sendNotification({
            receiver: sellerId,
            receiverRole: "seller",
            sender: req.user.id,
            senderName: "Customer",
            title: "New Order",
            message: `Customer ordered "${titles[0]}"${titles.length > 1 ? ` and ${titles.length - 1} more` : ""}.`,
            type: "ORDER_PLACED",
            referenceId: order._id,
          })
        )
      );
    });

    return res.status(201).json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate({ path: "books", populate: { path: "seller", select: "name" } })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/seller-orders — orders containing at least one book this
// seller sold. Scoped strictly to req.user.id so a seller only ever sees
// their own sales, never another seller's orders.
exports.getSellerOrders = async (req, res) => {
  try {
    const myBookIds = await Book.find({ seller: req.user.id }).distinct("_id");
    const orders = await Order.find({ books: { $in: myBookIds } })
      .populate({ path: "books", match: { seller: req.user.id } })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    // populate's `match` leaves a `null` in the array for books that don't
    // match instead of removing them — strip those out so each order in
    // the response only ever contains this seller's own books.
    const scoped = orders.map((order) => {
      const obj = order.toObject();
      obj.books = obj.books.filter(Boolean);
      return obj;
    });

    return res.status(200).json({ success: true, orders: scoped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: "books",
      populate: { path: "seller", select: "name" },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Track an order (and its bill) using the human-friendly tracking ID
// e.g. "BKF-M9X2K7-4F3A", shown to the customer after checkout.
exports.trackOrder = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const order = await Order.findOne({ trackingId: trackingId.toUpperCase() })
      .populate({ path: "books", populate: { path: "seller", select: "name" } })
      .populate("customer", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "No order found with this tracking ID" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};