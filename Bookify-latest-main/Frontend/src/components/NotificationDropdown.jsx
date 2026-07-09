import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCheck, Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationApi,
} from "../api/notifications";
import {
  notificationsLoaded,
  notificationMarkedRead,
  allNotificationsMarkedRead,
  notificationRemoved,
} from "../store/notificationSlice";

export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loaded } = useSelector((s) => s.notifications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch fresh on open so the dropdown reflects reality even if it
    // wasn't the first load of the session.
    setLoading(true);
    fetchNotifications(1, 20)
      .then((res) => {
        const { notifications, unreadCount: count, page, hasMore } = res.data;
        dispatch(notificationsLoaded({ notifications, unreadCount: count, page, hasMore }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = (id) => {
    dispatch(notificationMarkedRead(id));
    markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    dispatch(allNotificationsMarkedRead());
    markAllNotificationsRead().catch(() => {});
  };

  const handleDelete = (id) => {
    dispatch(notificationRemoved(id));
    deleteNotificationApi(id).catch(() => {});
  };

  const latest = items.slice(0, 8);

  return (
    <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] bg-white border border-mint-line rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mint-line">
        <p className="font-display text-sm text-ink">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs flex items-center gap-1 text-forest hover:text-forest-dark font-medium transition"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading && loaded === false ? (
          <div className="px-4 py-10 text-center text-sm text-muted">Loading…</div>
        ) : latest.length === 0 ? (
          <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
            <Bell size={22} className="text-mint-line" />
            <p className="text-sm text-muted">You're all caught up.</p>
          </div>
        ) : (
          latest.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              compact
            />
          ))
        )}
      </div>

      <button
        onClick={() => { onClose(); navigate("/notifications"); }}
        className="w-full text-center text-sm font-semibold text-forest py-3 border-t border-mint-line hover:bg-mint/40 transition"
      >
        View all notifications
      </button>
    </div>
  );
}
