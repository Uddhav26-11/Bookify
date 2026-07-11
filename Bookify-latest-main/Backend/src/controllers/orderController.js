const Order = require("../models/Order");

exports.placeOrder = async (req, res) => {
  try {
    const { books, totalAmount, address } = req.body;

    const order = await Order.create({
      customer: req.user.id,
      books,
      totalAmount,
      address,
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