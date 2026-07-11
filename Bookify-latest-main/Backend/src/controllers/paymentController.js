const stripe = require("../config/stripe");
const Order = require("../models/Order");
const Book = require("../models/Book");
const { sendNotification, notifySafely } = require("../services/notificationService");

// Creates the Order document for a completed Stripe Checkout session — and
// marks the purchased books as sold — but is idempotent: if an Order for
// this session already exists (created earlier by the webhook, or by a
// concurrent call to this same function), it just returns that existing
// order instead of creating a duplicate. This is what lets us safely call
// it from BOTH the webhook (the "real" path in production) AND from
// getOrderBySession as a fallback (needed in local dev, where the Stripe
// webhook often isn't running/forwarded, so the webhook path never fires
// and the order would otherwise never get created).
async function createOrderFromSession(session) {
  const existing = await Order.findOne({ stripeSessionId: session.id });
  if (existing) return existing;

  const bookIds = JSON.parse(session.metadata.bookIds);
  const billItems = JSON.parse(session.metadata.billItems || "[]");
  const deliveryFee = Number(session.metadata.deliveryFee || 0);
  const subtotal = billItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5);

  let order;
  try {
    order = await Order.create({
      customer: session.metadata.customerId,
      books: bookIds,
      totalAmount: session.amount_total / 100,
      address: session.metadata.address,
      paymentStatus: "Paid",
      orderStatus: "Confirmed",
      stripeSessionId: session.id,
      expectedDeliveryDate,
      bill: {
        items: billItems,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
      },
      statusHistory: [{ status: "Confirmed", note: "Payment received. Order confirmed." }],
    });
  } catch (err) {
    // Duplicate key on stripeSessionId — the webhook and the fallback path
    // (or two webhook retries) raced each other. Whoever lost the race just
    // fetches and returns the order the winner created; this guarantees
    // exactly one Order per successful payment.
    if (err.code === 11000) {
      const winner = await Order.findOne({ stripeSessionId: session.id });
      if (winner) return winner;
    }
    throw err;
  }

  await Book.updateMany({ _id: { $in: bookIds } }, { isSold: true });

  console.log(`Order ${order._id} created with tracking ID ${order.trackingId}`);
  return order;
}

// Customer checkout — creates a Stripe Checkout Session
exports.createCheckoutSession = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe Checkout Error: STRIPE_SECRET_KEY is missing in Backend/.env");
      return res.status(500).json({ success: false, message: "Payment is not configured on the server (missing STRIPE_SECRET_KEY)." });
    }
    if (!process.env.CLIENT_URL) {
      console.error("Stripe Checkout Error: CLIENT_URL is missing in Backend/.env");
      return res.status(500).json({ success: false, message: "Payment is not configured on the server (missing CLIENT_URL)." });
    }

    const { items, address } = req.body; 
    // items = [{ bookId, title, price, qty }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const DELIVERY_FEE = 30;

    const line_items = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100), // paise me
      },
      quantity: item.qty,
    }));

    // Add delivery fee as its own Stripe line item so amount_total matches the bill total.
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: { name: "Delivery Fee" },
        unit_amount: DELIVERY_FEE * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        customerId: req.user.id,
        address,
        bookIds: JSON.stringify(items.map((i) => i.bookId)),
        billItems: JSON.stringify(
          items.map((i) => ({ book: i.bookId, title: i.title, price: i.price, qty: i.qty }))
        ),
        deliveryFee: String(DELIVERY_FEE),
      },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    // Log the full Stripe error (error.raw often has the real reason, e.g. invalid API key)
    console.error("Stripe Checkout Error:", error.raw || error);
    notifySafely(() =>
      sendNotification({
        receiver: "admin",
        receiverRole: "admin",
        sender: null,
        senderName: "System",
        title: "Payment Issue",
        message: `Checkout session creation failed: ${error.message || "Unknown error"}.`,
        type: "PAYMENT_ISSUE",
        referenceId: null,
      })
    );
    return res.status(500).json({ success: false, message: error.message || "Payment session creation failed" });
  }
};

// Stripe Webhook — confirms payment and creates Order in DB
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      await createOrderFromSession(session);
    } catch (err) {
      console.error("Order creation from webhook failed:", err.message);
      notifySafely(() =>
        sendNotification({
          receiver: "admin",
          receiverRole: "admin",
          sender: null,
          senderName: "System",
          title: "Payment Issue",
          message: `Order creation failed after a successful payment (session ${session.id}): ${err.message}`,
          type: "PAYMENT_ISSUE",
          referenceId: session.id,
        })
      );
    }
  }

  res.status(200).json({ received: true });
};

// Used by the frontend /order-success page right after Stripe redirects back.
// In production the webhook usually creates the Order first, so this just
// reads it. But webhooks are frequently NOT running/forwarded in local dev
// (no `stripe listen`), which used to mean the Order was silently never
// created and the customer's order permanently disappeared. To fix that at
// the root, this route now independently verifies the session directly with
// Stripe and creates the Order itself if it isn't there yet — so the order
// always shows up whether or not the webhook actually fired.
exports.getOrderBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    let order = await Order.findOne({ stripeSessionId: sessionId })
      .populate({ path: "books", populate: { path: "seller", select: "name" } })
      .populate("customer", "name email");

    if (!order) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return res.status(404).json({ success: false, message: "Order not ready yet" });
      }

      // Ownership check — a customer should only ever be able to trigger
      // order-creation for their own checkout session.
      if (String(session.metadata.customerId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized for this session" });
      }

      await createOrderFromSession(session);
      order = await Order.findOne({ stripeSessionId: sessionId })
        .populate({ path: "books", populate: { path: "seller", select: "name" } })
        .populate("customer", "name email");
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not ready yet" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("getOrderBySession error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};