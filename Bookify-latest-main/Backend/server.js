require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

// Wrap the Express app in a plain http.Server so Socket.IO can attach to
// the same port instead of needing a separate server/port.
const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
});
