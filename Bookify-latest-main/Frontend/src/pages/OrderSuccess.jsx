import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import api from "../api/axios";

// Shown right after Stripe redirects the customer back.
// The Order is created asynchronously by the Stripe webhook, so we poll
// for a few seconds until it shows up, then send the customer to their
// orders page where they can track delivery.
export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | found | timeout

  useEffect(() => {
    if (!sessionId) {
      setStatus("timeout");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await api.get(`/payment/session/${sessionId}`);
        if (!cancelled) {
          setOrder(res.data.order);
          setStatus("found");
        }
      } catch (err) {
        if (cancelled) return;
        if (attempts >= 8) {
          setStatus("timeout");
        } else {
          setTimeout(poll, 1500);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      {status === "loading" && (
        <>
          <div className="w-12 h-12 border-4 border-forest/20 border-t-forest rounded-full animate-spin mx-auto" />
          <p className="text-muted mt-6">Confirming your payment and creating your order...</p>
        </>
      )}

      {status === "found" && order && (
        <div className="bg-white border border-mint-line rounded-2xl p-8">
          <CheckCircle2 size={48} className="text-forest mx-auto" />
          <h1 className="text-2xl font-bold text-ink mt-4">Payment Successful!</h1>
          <p className="text-muted text-sm mt-2">Your order has been placed and confirmed.</p>

          <div className="bg-mint border border-mint-line rounded-xl p-4 mt-6 text-left">
            <p className="text-xs font-mono text-muted">Tracking ID</p>
            <p className="text-lg font-bold text-forest font-mono">{order.trackingId}</p>
            <p className="text-xs text-muted mt-2">
              Use this ID anytime to track your delivery from the Orders page.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 bg-forest text-white font-semibold py-3 rounded-full hover:bg-forest-dark transition flex items-center justify-center gap-2"
            >
              <Package size={18} /> View My Orders
            </button>
          </div>
        </div>
      )}

      {status === "timeout" && (
        <div className="bg-white border border-mint-line rounded-2xl p-8">
          <h1 className="text-xl font-bold text-ink">Payment received</h1>
          <p className="text-muted text-sm mt-2">
            We're still finalizing your order. It will appear on your Orders page in a moment.
          </p>
          <Link
            to="/orders"
            className="inline-block mt-6 bg-forest text-white font-semibold py-3 px-6 rounded-full hover:bg-forest-dark transition"
          >
            Go to My Orders
          </Link>
        </div>
      )}
    </div>
  );
}