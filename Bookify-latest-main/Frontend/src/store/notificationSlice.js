import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // notifications currently loaded (newest first)
  unreadCount: 0,
  page: 1,
  hasMore: true,
  loaded: false, // whether we've fetched at least once this session
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Replace/append a page of notifications loaded from the API.
    notificationsLoaded: (state, action) => {
      const { notifications, unreadCount, page, hasMore } = action.payload;
      state.items = page === 1 ? notifications : [...state.items, ...notifications];
      state.unreadCount = unreadCount;
      state.page = page;
      state.hasMore = hasMore;
      state.loaded = true;
    },
    unreadCountSet: (state, action) => {
      state.unreadCount = action.payload;
    },
    // A brand-new notification arrived over the socket — prepend it and
    // bump the unread count (avoids duplicates if it somehow already exists).
    notificationAdded: (state, action) => {
      const notification = action.payload;
      const exists = state.items.some((n) => n._id === notification._id);
      if (!exists) {
        state.items.unshift(notification);
        if (!notification.read) state.unreadCount += 1;
      }
    },
    notificationMarkedRead: (state, action) => {
      const id = action.payload;
      const notification = state.items.find((n) => n._id === id);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    allNotificationsMarkedRead: (state) => {
      state.items.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
    },
    notificationRemoved: (state, action) => {
      const id = action.payload;
      const notification = state.items.find((n) => n._id === id);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((n) => n._id !== id);
    },
    notificationsReset: () => initialState,
  },
});

export const {
  notificationsLoaded,
  unreadCountSet,
  notificationAdded,
  notificationMarkedRead,
  allNotificationsMarkedRead,
  notificationRemoved,
  notificationsReset,
} = notificationSlice.actions;

export default notificationSlice.reducer;
