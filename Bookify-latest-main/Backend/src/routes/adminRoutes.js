const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllPickups,
  updatePickupStatus,
  assignPickupExecutive,
  payPickup,
  getAllUsers,
  updateBookPrice,
  sendCounterOffer,
  deleteBook,
  deletePickupRequest,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);
router.get("/pickups", protect, authorizeRoles("admin"), getAllPickups);
router.patch(
  "/pickups/:id/status",
  protect,
  authorizeRoles("admin"),
  updatePickupStatus,
);
router.post(
  "/assign-pickup",
  protect,
  authorizeRoles("admin"),
  assignPickupExecutive,
);
router.patch("/pickups/:id/pay", protect, authorizeRoles("admin"), payPickup);
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.patch("/books/:bookId/price",protect,authorizeRoles("admin"),updateBookPrice,);
router.patch("/books/:bookId/counter-offer", protect, authorizeRoles("admin"), sendCounterOffer);
router.delete("/books/:bookId", protect, authorizeRoles("admin"), deleteBook);
router.delete("/pickups/:id", protect, authorizeRoles("admin"), deletePickupRequest);
router.get("/orders", protect, authorizeRoles("admin"), getAllOrders);
router.patch("/orders/:orderId/status",protect,authorizeRoles("admin"),updateOrderStatus,);

module.exports = router;