import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, disconnectSocket } from "../api/socket";
import { fetchUnreadCount } from "../api/notifications";
import {
  notificationAdded,
  notificationMarkedRead,
  allNotificationsMarkedRead,
  notificationRemoved,
  unreadCountSet,
  notificationsReset,
} from "../store/notificationSlice";

// Establishes the Socket.IO connection for the logged-in user and wires up
// the four server events (Feature 6) to Redux, so the bell + dropdown +
// notifications page all update instantly with no page refresh anywhere
// in the app. Mount this once near the root (in App.jsx).
export default function useNotificationSocket() {
  const { id, role } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const connectedRef = useRef(false);

  useEffect(() => {
    // Admin's virtual id is the string "admin" — still a valid room key.
    const userKey = role === "admin" ? "admin" : id;

    if (!userKey) {
      if (connectedRef.current) {
        disconnectSocket();
        dispatch(notificationsReset());
        connectedRef.current = false;
      }
      return;
    }

    const socket = connectSocket();
    connectedRef.current = true;

    // Prime the unread badge immediately on connect/login, then let socket
    // events keep it live from here.
    fetchUnreadCount()
      .then((res) => dispatch(unreadCountSet(res.data.count)))
      .catch(() => {});

    const handleNew = (notification) => dispatch(notificationAdded(notification));
    const handleRead = (payload) => dispatch(notificationMarkedRead(payload.id));
    const handleUpdate = (payload) => {
      if (payload?.allRead) dispatch(allNotificationsMarkedRead());
    };
    const handleDelete = (payload) => dispatch(notificationRemoved(payload.id));

    socket.on("notification:new", handleNew);
    socket.on("notification:read", handleRead);
    socket.on("notification:update", handleUpdate);
    socket.on("notification:delete", handleDelete);

    // If the socket drops and reconnects, refresh the unread count in case
    // anything happened while disconnected.
    socket.on("connect", () => {
      fetchUnreadCount()
        .then((res) => dispatch(unreadCountSet(res.data.count)))
        .catch(() => {});
    });

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:read", handleRead);
      socket.off("notification:update", handleUpdate);
      socket.off("notification:delete", handleDelete);
    };
  }, [id, role, dispatch]);
}
