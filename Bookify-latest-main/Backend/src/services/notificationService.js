const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

// Emit a raw socket event to a single user's private room. Safe to call
// even if Socket.IO hasn't been initialized (e.g. in scripts/tests) — it
// just silently no-ops instead of throwing.
function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

// Create + persist a single notification, then push it instantly over
// Socket.IO to the receiver if they're connected. Never throws upward on
// socket failure — DB persistence is the source of truth; delivery is
// best-effort on top of it.
async function sendNotification({ receiver, receiverRole, sender = null, senderName = "", title, message, type, referenceId = null }) {
  const notification = await Notification.create({
    receiver: String(receiver),
    receiverRole,
    sender: sender != null ? String(sender) : null,
    senderName,
    title,
    message,
    type,
    referenceId: referenceId != null ? String(referenceId) : null,
  });

  emitToUser(receiver, "notification:new", notification);
  return notification;
}

// Same idea, but fans the same notification content out to many receivers
// at once (e.g. "New Book Available" -> every customer). Each receiver gets
// their own Notification document so read/unread state is per-user.
async function sendBulkNotification(receiverIds, receiverRole, payload) {
  const ids = [...new Set((receiverIds || []).map(String))].filter(Boolean);
  if (ids.length === 0) return [];

  const docs = ids.map((id) => ({
    receiver: id,
    receiverRole,
    sender: payload.sender != null ? String(payload.sender) : null,
    senderName: payload.senderName || "",
    title: payload.title,
    message: payload.message,
    type: payload.type,
    referenceId: payload.referenceId != null ? String(payload.referenceId) : null,
  }));

  const created = await Notification.insertMany(docs);
  created.forEach((notification) => emitToUser(notification.receiver, "notification:new", notification));
  return created;
}

// Fire-and-forget wrapper — use this at call sites where a notification
// failing to send must NEVER block or break the main request (book upload,
// order placement, etc). Errors are logged, not thrown.
function notifySafely(fn) {
  Promise.resolve()
    .then(fn)
    .catch((error) => console.error("Notification error:", error.message));
}

module.exports = {
  sendNotification,
  sendBulkNotification,
  emitToUser,
  notifySafely,
};
