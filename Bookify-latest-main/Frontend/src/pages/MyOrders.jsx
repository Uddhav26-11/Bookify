import { useEffect, useState } from "react";
import { Package, Search, Receipt, MapPin } from "lucide-react";
import StatusPill from "../components/StatusPill";
import api from "../api/axios";

const STEPS = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

function TrackingTimeline({ orderStatus, statusHistory = [] }) {
  const currentIndex = STEPS.indexOf(orderStatus);

  return (
    <div className="flex items-center justify-between mt-5">
      {STEPS.map((step, i) => {
        const done = currentIndex >= i && orderStatus !== "Cancelled";
        const entry = statusHistory.find((h) => h.status === step);
        return (
          <div key={step} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && (
              <div
                className={`absolute top-2.5 right-1/2 h-0.5 w-full -z-10 ${
                  done ? "bg-brand-gradient" : "bg-mint-line"
                }`}
              />
            )}
            <div
              className={`w-5 h-5 rounded-full border-2 ${
                done ? "bg-brand-gradient border-transparent" : "bg-white border-mint-line"
              }`}
            />
            <p className={`text-[11px] mt-2 font-medium ${done ? "text-forest" : "text-muted"}`}>{step}</p>
            {entry && (
              <p className="text-[10px] text-muted mt-0.5">
                {new Date(entry.at).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const paymentBadge =
    order.paymentStatus === "Paid" ? "btn-brand text-white" : "bg-amber/15 text-amber";

  return (
    <div className="bg-white border border-mint-line rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-muted">Tracking ID</p>
          <p className="font-bold text-forest font-mono">{order.trackingId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${paymentBadge}`}>
            {order.paymentStatus}
          </span>
          <StatusPill status={order.orderStatus} />
        </div>
      </div>

      <p className="text-xs text-muted mt-3">
        Purchased on {new Date(order.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-4 space-y-3">
        {order.books.map((b) => (
          <div key={b._id} className="flex items-center gap-3">
            {b.images?.[0] ? (
              <img src={b.images[0]} alt={b.bookName} className="w-12 h-12 rounded-lg object-cover border border-mint-line" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-mint flex items-center justify-center text-muted">
                <Package size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-ink">{b.bookName}</p>
              <p className="text-xs text-muted">Sold by {b.seller?.name || "Unknown seller"}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-ink mt-4">Amount Paid: ₹{order.totalAmount}</p>

      {order.orderStatus !== "Cancelled" && <TrackingTimeline orderStatus={order.orderStatus} statusHistory={order.statusHistory} />}

      {order.expectedDeliveryDate && (
        <p className="text-xs text-muted mt-4 flex items-center gap-1.5">
          <MapPin size={13} /> Expected delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
        </p>
      )}

      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-xs font-semibold text-forest mt-4 flex items-center gap-1.5 hover:underline"
      >
        <Receipt size={14} /> {expanded ? "Hide bill" : "View bill"}
      </button>

      {expanded && order.bill && (
        <div className="bg-mint border border-mint-line rounded-xl p-4 mt-3 text-sm">
          {order.bill.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-xs mb-1.5">
              <span>{item.title} x{item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="border-t border-mint-line mt-2 pt-2 flex justify-between text-xs">
            <span className="text-muted">Delivery Fee</span>
            <span>₹{order.bill.deliveryFee}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink mt-1">
            <span>Total</span>
            <span>₹{order.bill.total}</span>
          </div>
          <p className="text-[11px] text-muted mt-2">Delivery address: {order.address}</p>
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trackId, setTrackId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(err.response?.data?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const trackByCode = async (e) => {
    e.preventDefault();
    setTrackError("");
    setTrackedOrder(null);
    try {
      const res = await api.get(`/orders/track/${trackId.trim()}`);
      setTrackedOrder(res.data.order);
    } catch (err) {
      setTrackError(err.response?.data?.message || "No order found with this tracking ID.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
        <Package size={28} className="text-forest" /> My Orders
      </h1>
      <p className="text-muted text-sm mt-1">Track your deliveries and view your bills.</p>

      <form onSubmit={trackByCode} className="bg-white border border-mint-line rounded-2xl p-5 flex flex-col sm:flex-row gap-3 sm:items-end mt-6">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted block mb-1">Track any order by tracking ID</label>
          <input
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="e.g. BKF-M9X2K7-4F3A"
            className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <button type="submit" className="btn-brand text-white font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2">
          <Search size={16} /> Track
        </button>
      </form>
      {trackError && <p className="text-rose text-sm font-medium mt-2">{trackError}</p>}
      {trackedOrder && (
        <div className="mt-4">
          <OrderCard order={trackedOrder} />
        </div>
      )}

      <div className="mt-8 space-y-5">
        {loading ? (
          <p className="text-sm text-muted">Loading your orders...</p>
        ) : error ? (
          <p className="text-sm text-rose">{error}</p>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-mint-line rounded-2xl p-10 text-center text-sm text-muted">
            No orders yet. Head to the marketplace to find your next book.
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order._id} order={order} />)
        )}
      </div>
    </div>
  );
}