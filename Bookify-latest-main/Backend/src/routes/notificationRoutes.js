const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// All notification routes require a logged-in user (admin, seller, or
// customer) — each user only ever sees/affects their own notifications
// since every query/update is scoped to req.user.id (see controller).
router.get("/", protect, getNotifications);
router.get("/unread", protect, getUnreadCount);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
