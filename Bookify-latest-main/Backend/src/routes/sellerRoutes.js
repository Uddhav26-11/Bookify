const express = require("express");
const router = express.Router();
const { getSellerProfile, updateBankDetails, getMyBooks, getMyPaymentHistory, getSellerDashboardStats, trackPayment, respondToCounterOffer } = require("../controllers/sellerController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/profile", protect, authorizeRoles("seller"), getSellerProfile);
router.patch("/bank-details", protect, authorizeRoles("seller"), updateBankDetails);
router.get("/my-books", protect, authorizeRoles("seller"), getMyBooks);
router.get("/payments", protect, authorizeRoles("seller"), getMyPaymentHistory);
router.get("/dashboard", protect, authorizeRoles("seller"), getSellerDashboardStats);
router.get("/track/:trackingId", protect, authorizeRoles("seller"), trackPayment);
router.patch("/books/:bookId/counter-offer-response", protect, authorizeRoles("seller"), respondToCounterOffer);

module.exports = router;