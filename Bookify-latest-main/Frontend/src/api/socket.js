import { io } from "socket.io-client";

// Derive the socket server origin from the API URL by stripping the
// trailing "/api" — e.g. "http://localhost:5000/api" -> "http://localhost:5000".
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "bookify_token";

let socket = null;

// Opens (or reuses) the socket connection. The JWT is sent explicitly via
// the handshake `auth` payload (read fresh from sessionStorage) since the
// socket.io-client doesn't reliably forward the app's Authorization header,
// and the httpOnly cookie is kept only as a fallback.
export function connectSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    auth: { token: sessionStorage.getItem(TOKEN_KEY) },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}