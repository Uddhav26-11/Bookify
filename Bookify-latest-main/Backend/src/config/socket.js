const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Minimal cookie header parser — avoids pulling in an extra dependency just
// to read the httpOnly "token" cookie during the socket handshake.
function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, pair) => {
    const idx = pair.indexOf("=");
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const value = decodeURIComponent(pair.slice(idx + 1).trim());
      if (key) acc[key] = value;
    }
    return acc;
  }, {});
}

let ioInstance = null;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Auth every socket connection using the same JWT cookie used by the
  // regular REST API (see authMiddleware.protect), so only logged-in users
  // can connect and each user only ever joins their own room.
  io.use((socket, next) => {
    try {
      // Prefer the token explicitly sent by the client during the socket
      // handshake (the frontend sends the localStorage-persisted JWT this
      // way), falling back to the httpOnly cookie for backwards
      // compatibility with any existing cookie-based sessions.
      const token = socket.handshake.auth?.token || parseCookies(socket.handshake.headers.cookie || "").token;
      if (!token) {
        return next(new Error("Not authorized, no token"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role, email }
      next();
    } catch (error) {
      next(new Error("Not authorized, token failed"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user || {};
    if (!id) return;

    // Every user (including the virtual "admin" account) joins a private
    // room keyed by their id — this is how targeted notifications reach
    // exactly the right person.
    socket.join(`user:${id}`);
    if (role) socket.join(`role:${role}`);

    socket.on("disconnect", () => {
      // socket.io automatically leaves all rooms on disconnect; the client
      // handles reconnection on its own (reconnection: true by default).
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
