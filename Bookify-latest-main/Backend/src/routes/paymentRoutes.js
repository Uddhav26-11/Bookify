const express = require("express");
const router = express.Router();
const { createCheckoutSession, getOrderBySession } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/checkout", protect, authorizeRoles("customer"), createCheckoutSession);
router.get("/session/:sessionId", protect, authorizeRoles("customer"), getOrderBySession);

module.exports = router;