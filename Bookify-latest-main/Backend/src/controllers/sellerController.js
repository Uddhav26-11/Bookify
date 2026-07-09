const User = require("../models/User");
const Book = require("../models/Book");
const Order = require("../models/Order");
const PickupRequest = require("../models/PickupRequest");
const { sendNotification, notifySafely } = require("../services/notificationService");

exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.user.id).select("-password");
    return res.status(200).json({ success: true, seller });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Seller adds/updates the bank (or UPI) details admin will use to pay them.
exports.updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

    if (!upiId && (!accountHolderName || !accountNumber || !ifscCode || !bankName)) {
      return res.status(400).json({
        success: false,
        message: "Provide either a UPI ID or full bank details (account holder name, account number, IFSC, bank name).",
      });
    }

    const seller = await User.findByIdAndUpdate(
      req.user.id,
      {
  bankDetails: {
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    upiId,
    isAdded: true,
  },
},
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Bank details saved", seller });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyBooks = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, books });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPaymentHistory = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user.id, status: { $in: ["Paid", "Completed"] } });
    return res.status(200).json({ success: true, payments: books });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/seller/dashboard — Completed Orders, Revenue, Books Sold, Pending
// Orders for the logged-in seller, computed live from the Order collection
// (never hardcoded, never cached client-side) so it's always correct and
// never resets to 0 on refresh.
//
// Each customer Order can contain books from multiple sellers, so revenue
// can't just be `order.totalAmount` — that's the WHOLE order's total, not
// this seller's share. Instead we unwind `order.bill.items` (the per-book
// price snapshot captured at checkout, in orderController/paymentController)
// and only sum the line items whose book belongs to this seller.
exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const myBookIds = await Book.find({ seller: sellerId }).distinct("_id");

    if (myBookIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: { completedOrders: 0, pendingOrders: 0, revenue: 0, booksSold: 0 },
      });
    }

    const [result] = await Order.aggregate([
      // Only orders that include at least one of this seller's books.
      { $match: { books: { $in: myBookIds }, orderStatus: { $ne: "Cancelled" } } },
      { $unwind: "$bill.items" },
      // Narrow down to just this seller's own line items within the order
      // (an order may also contain other sellers' books).
      { $match: { "bill.items.book": { $in: myBookIds } } },
      {
        $group: {
          _id: null,
          completedOrderIds: {
            $addToSet: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$_id", "$$REMOVE"] },
          },
          pendingOrderIds: {
            $addToSet: { $cond: [{ $ne: ["$paymentStatus", "Paid"] }, "$_id", "$$REMOVE"] },
          },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                { $multiply: ["$bill.items.price", "$bill.items.qty"] },
                0,
              ],
            },
          },
          booksSold: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$bill.items.qty", 0] },
          },
        },
      },
    ]);

    const stats = {
      completedOrders: result?.completedOrderIds?.length || 0,
      pendingOrders: result?.pendingOrderIds?.length || 0,
      revenue: result?.revenue || 0,
      booksSold: result?.booksSold || 0,
    };

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Seller responds to an admin's counter-offer price with Accept or Reject.
// Accept -> that price becomes final and the book/pickup moves to Approved.
// Reject -> goes back to the admin's queue so they can send a new offer,
// agree to the seller's original ask, or drop the request.
exports.respondToCounterOffer = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { action } = req.body; // "Accept" | "Reject"

    if (!["Accept", "Reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'Accept' or 'Reject'" });
    }

    const book = await Book.findOne({ _id: bookId, seller: req.user.id });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (book.priceApproval !== "Pending") {
      return res.status(400).json({ success: false, message: "There is no pending price offer for this book." });
    }

    if (action === "Accept") {
      book.finalPrice = book.adminOfferedPrice;
      book.priceApproval = "Accepted";
      book.status = "Approved";
      book.priceHistory.push({ price: book.adminOfferedPrice, changedBy: "seller-accepted-offer" });
      await book.save();

      // If every book on the parent pickup is past negotiation, move the
      // whole pickup to Approved too so it's ready for physical collection.
      const pickup = await PickupRequest.findOne({ books: bookId });
      if (pickup) {
        const siblingBooks = await Book.find({ _id: { $in: pickup.books } });
        const allResolved = siblingBooks.every((b) => b.priceApproval !== "Pending");
        if (allResolved) {
          pickup.status = "Approved";
          await pickup.save();
        }
      }
    } else {
      book.priceApproval = "Rejected";
      book.status = "Requested";
      await book.save();
      await PickupRequest.updateMany({ books: bookId }, { status: "Requested" });
    }

    notifySafely(async () => {
      const seller = await User.findById(req.user.id).select("name");
      await sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: req.user.id,
        senderName: seller?.name || "A seller",
        title: action === "Accept" ? "Price Offer Accepted" : "Price Offer Rejected",
        message: `Seller ${seller?.name || ""} ${action === "Accept" ? "accepted" : "rejected"} the price offer for "${book.bookName}".`,
        type: action === "Accept" ? "BOOK_APPROVED" : "BOOK_REJECTED",
        referenceId: book._id,
      });
    });

    return res.status(200).json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Seller tracks the approval + payout of a specific book using its
// payment tracking code (e.g. "PMT-K3X9F1").
exports.trackPayment = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const book = await Book.findOne({ trackingId: trackingId.toUpperCase(), seller: req.user.id });
    if (!book) {
      return res.status(404).json({ success: false, message: "No book found with this tracking ID" });
    }
    return res.status(200).json({ success: true, book });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};