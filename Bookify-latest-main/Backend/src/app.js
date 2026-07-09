const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const bookRoutes = require("./routes/bookRoutes");
const aiRoutes = require("./routes/aiRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const orderRoutes = require("./routes/orderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { stripeWebhook } = require("./controllers/paymentController");

const app = express();

// Stripe Webhook
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
   "https://bookify-4.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Bookify API running...");
});

module.exports = app;