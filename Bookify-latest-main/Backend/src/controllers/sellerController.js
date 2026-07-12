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
// Orders for the logged-in seller, computed live (never hardcoded, never
// cached client-side) so it's always correct and never resets to 0 on
// refresh.
//
// IMPORTANT: this counts the seller's OWN sell-to-platform flow (the
// pickup request -> admin approval -> payout flow on the Book model, whose
// tracking you see under "Track Requests"/"Payment History"), NOT the
// customer-Order resale flow. Those are two different transactions: a book
// can be marked "Paid" here the moment the seller is paid for handing the
// book over, long before (or even if never) a customer buys it off the
// marketplace afterwards. Tying these stats to customer Orders meant a
// seller who was already paid still saw ₹0 revenue until a stranger bought
// the book — that was the bug.
exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const books = await Book.find({ seller: sellerId, status: { $ne: "Rejected" } }).select(
      "status finalPrice sellerProposedPrice aiEstimatedPrice"
    );

    const paidStatuses = ["Paid", "Completed"];
    const approvedStatuses = ["Approved", "Collected", "Paid", "Completed"];
    const pendingStatuses = ["Requested", "Assigned", "UnderVerification"];

    let completedOrders = 0;
    let pendingOrders = 0;
    let revenue = 0;
    let booksSold = 0;
    let approvedBooks = 0;
    let pendingBooks = 0;

    for (const book of books) {
      if (paidStatuses.includes(book.status)) {
        completedOrders += 1;
        booksSold += 1;
        revenue += book.finalPrice || book.aiEstimatedPrice || 0;
      } else {
        pendingOrders += 1;
      }

      if (approvedStatuses.includes(book.status)) approvedBooks += 1;
      if (pendingStatuses.includes(book.status)) pendingBooks += 1;
    }

    return res.status(200).json({
      success: true,
      stats: {
        // Existing keys (kept for backward compatibility with current UI)
        completedOrders,
        pendingOrders,
        revenue,
        booksSold,
        // Overview-card keys
        totalBooks: books.length,
        pendingBooks,
        approvedBooks,
        soldBooks: booksSold,
        earnings: revenue,
      },
    });
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