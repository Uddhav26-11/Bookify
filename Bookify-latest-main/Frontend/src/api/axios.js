import axios from "axios";

const TOKEN_KEY = "bookify_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // Keep sending the httpOnly cookie too (backwards compatible), but the
  // Authorization header below is what actually keeps the session alive
  // across refreshes, since it's read fresh from localStorage on every
  // request rather than depending on cookie survival/CORS quirks.
  withCredentials: true,
});

// Attach the persisted JWT (if any) to every outgoing request so the
// backend can authenticate the user even after a full page refresh wipes
// in-memory Redux state.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;