const Notification = require("../models/Notification");
const { emitToUser } = require("../services/notificationService");

// GET /api/notifications?page=1&limit=20
// Loads the latest 20 notifications by default, with pagination for older
// ones (Feature 9: performance).
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;
    // Scope strictly to THIS logged-in user's own id AND role — e.g. an
    // admin only ever sees notifications addressed to receiver "admin"
    // (which are the ones sellers/customers send admin), and a seller only
    // ever sees notifications addressed to their own user id (the ones
    // admin sends them). The extra receiverRole check is a defense-in-depth
    // guard against any notification ever being mis-targeted.
    const receiver = String(req.user.id);
    const filter = { receiver, receiverRole: req.user.role };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      page,
      hasMore: skip + notifications.length < total,
      total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/unread — just the count, for the bell badge.
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      receiver: String(req.user.id),
      receiverRole: req.user.role,
      read: false,
    });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiver: String(req.user.id) },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    emitToUser(req.user.id, "notification:read", { id: notification._id });
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: String(req.user.id), receiverRole: req.user.role, read: false },
      { read: true }
    );
    emitToUser(req.user.id, "notification:update", { allRead: true });
    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiver: String(req.user.id),
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    emitToUser(req.user.id, "notification:delete", { id: req.params.id });
    return res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
