import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Trash2 } from "lucide-react";
import { removeFromCart } from "../store/cartSlice";
import api from "../api/axios";

export default function Cart() {
  const items = useSelector((s) => s.cart.items);
  const { role } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const delivery = items.length ? 30 : 0;
  const total = subtotal + delivery;

  const handleCheckout = async () => {
    setError("");

    if (role !== "customer") {
      setError("Please login as a customer to checkout.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/payment/checkout", {
        items: items.map((i) => ({
          bookId: i.id,
          title: i.title,
          price: i.price,
          qty: i.qty,
        })),
        address: address.trim(),
      });

      // Redirect to Stripe's hosted checkout page
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">Your Cart</h1>

      {items.length === 0 ? (
        <p className="text-muted mt-6">Your cart is empty.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <div className="md:col-span-2 space-y-4">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-4 bg-white border border-mint-line rounded-xl p-4">
                <img src={i.image} alt={i.title} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">{i.title}</p>
                  <p className="text-xs text-muted">Qty {i.qty}</p>
                </div>
                <p className="font-semibold text-forest">₹{i.price * i.qty}</p>
                <button onClick={() => dispatch(removeFromCart(i.id))} className="text-muted hover:text-rose">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-mint border border-mint-line rounded-2xl p-5 h-fit">
            <h2 className="font-display font-semibold text-ink mb-4">Order Summary</h2>

            <label className="text-xs font-medium text-muted block mb-1">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no, street, city, pincode"
              rows={2}
              className="w-full border border-mint-line rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-forest bg-white"
            />

            <div className="flex justify-between text-sm mb-2"><span className="text-muted">Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-muted">Delivery</span><span>₹{delivery}</span></div>
            <div className="flex justify-between font-semibold text-ink border-t border-mint-line pt-3 mt-3"><span>Total</span><span>₹{total}</span></div>

            {error && <p className="text-rose text-xs font-medium mt-3">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full btn-brand text-white font-semibold py-3 rounded-full mt-5 transition disabled:opacity-50"
            >
              {loading ? "Redirecting to payment..." : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}