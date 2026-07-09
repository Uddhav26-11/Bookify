import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCheck, Bell } from "lucide-react";
import NotificationItem from "../components/NotificationItem";
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

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { items, unreadCount, page, hasMore, loaded } = useSelector((s) => s.notifications);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchNotifications(1, 20)
      .then((res) => {
        const { notifications, unreadCount: count, page: p, hasMore: more } = res.data;
        dispatch(notificationsLoaded({ notifications, unreadCount: count, page: p, hasMore: more }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    setLoadingMore(true);
    fetchNotifications(page + 1, 20)
      .then((res) => {
        const { notifications, unreadCount: count, page: p, hasMore: more } = res.data;
        dispatch(notificationsLoaded({ notifications, unreadCount: count, page: p, hasMore: more }));
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Notifications</h1>
          <p className="text-sm text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm flex items-center gap-1.5 text-forest hover:text-forest-dark font-semibold transition"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
        {loading && !loaded ? (
          <div className="px-4 py-16 text-center text-sm text-muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 flex flex-col items-center gap-2 text-center">
            <Bell size={28} className="text-mint-line" />
            <p className="text-sm text-muted">No notifications yet.</p>
          </div>
        ) : (
          items.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {hasMore && items.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-full border border-mint-line text-sm font-medium text-ink hover:bg-mint transition disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
