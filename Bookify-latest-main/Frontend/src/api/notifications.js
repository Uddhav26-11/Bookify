import api from "./axios";

export const fetchNotifications = (page = 1, limit = 20) =>
  api.get(`/notifications?page=${page}&limit=${limit}`);

export const fetchUnreadCount = () => api.get("/notifications/unread");

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.patch("/notifications/read-all");

export const deleteNotificationApi = (id) => api.delete(`/notifications/${id}`);
