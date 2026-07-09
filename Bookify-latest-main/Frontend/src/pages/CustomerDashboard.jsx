import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, User as UserIcon } from "lucide-react";
import api from "../api/axios";

export default function CustomerDashboard() {
  const { name, email } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((res) => setOrderCount(res.data.orders?.length || 0))
      .catch(() => setOrderCount(0));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-ink">Welcome, {name}</h1>
      <p className="text-muted text-sm mt-1">Browse books, track your orders, and manage your account.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <div className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Account</p>
            <p className="text-sm font-semibold text-ink">{email}</p>
          </div>
        </div>

        <div className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Cart Items</p>
            <p className="text-2xl font-semibold text-ink">{cartCount}</p>
          </div>
        </div>

        <Link to="/orders" className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4 hover:bg-mint transition">
          <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">Orders</p>
            <p className="text-2xl font-semibold text-ink">{orderCount}</p>
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Link
          to="/marketplace"
          className="bg-forest text-white font-semibold rounded-2xl p-6 hover:bg-forest-dark transition flex items-center justify-between"
        >
          Browse Books <ShoppingBag size={20} />
        </Link>
        <Link
          to="/cart"
          className="bg-white border border-mint-line text-ink font-semibold rounded-2xl p-6 hover:bg-mint transition flex items-center justify-between"
        >
          View Cart <Package size={20} />
        </Link>
        <Link
          to="/orders"
          className="bg-white border border-mint-line text-ink font-semibold rounded-2xl p-6 hover:bg-mint transition flex items-center justify-between"
        >
          Track My Orders <Package size={20} />
        </Link>
      </div>
    </div>
  );
}