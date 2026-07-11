const express = require("express");
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById, trackOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/place", protect, authorizeRoles("customer"), placeOrder);
router.get("/my-orders", protect, authorizeRoles("customer"), getMyOrders);
router.get("/track/:trackingId", protect, trackOrder);
router.get("/:id", protect, getOrderById);

module.exports = router;