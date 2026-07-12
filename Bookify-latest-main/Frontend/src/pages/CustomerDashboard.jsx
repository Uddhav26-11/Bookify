import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Package, Search, CheckCircle2, Clock, Sparkles,
  BookOpen, GraduationCap, Award, Library, ArrowRight, PackageSearch,
} from "lucide-react";
import BackButton from "../components/BackButton";
import api from "../api/axios";

const QUICK_CATEGORIES = [
  { label: "School", icon: BookOpen, param: "school" },
  { label: "College", icon: GraduationCap, param: "college" },
  { label: "Competitive", icon: Award, param: "competitive" },
  { label: "Other", icon: Library, param: "other" },
];

function StatCard({ icon: Icon, label, value, to, accent = false }) {
  const Wrapper = to ? Link : "div";
  return (
    <Wrapper
      to={to}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border transition-all ${
        accent
          ? "border-transparent text-white shadow-lg shadow-forest/20"
          : "bg-white border-mint-line hover:border-forest/30 hover:shadow-md hover:shadow-forest/5 hover:-translate-y-0.5"
      } ${to ? "cursor-pointer" : ""}`}
      style={accent ? { background: "var(--brand-gradient)" } : undefined}
    >
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-white/20 text-white" : "bg-mint text-forest"
        }`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] sm:text-xs font-mono truncate ${accent ? "text-white/85" : "text-muted"}`}>{label}</p>
        <p className={`text-xl sm:text-2xl font-bold leading-tight ${accent ? "text-white" : "text-ink"}`}>{value}</p>
      </div>
    </Wrapper>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4 border border-mint-line bg-white animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-mint shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-16 bg-mint rounded" />
        <div className="h-5 w-10 bg-mint rounded" />
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { name, email } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const orderCount = orders.length;
  const purchasedCount = orders.filter((o) => o.orderStatus === "Delivered").length;
  const pendingCount = orders.filter((o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length;

  const firstName = (name || "there").split(" ")[0];

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/marketplace?q=${encodeURIComponent(query.trim())}` : "/marketplace");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <BackButton fallback="/" />

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl mt-5 p-6 sm:p-10 text-white shadow-xl shadow-forest/15"
        style={{ background: "var(--brand-gradient-deep)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-lime/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-xs font-mono bg-white/15 px-3 py-1 rounded-full mb-3">
            <Sparkles size={12} /> Welcome back
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
            👋 Hi, {firstName}
          </h1>
          <p className="text-white/85 text-sm sm:text-base mt-2 max-w-lg">
            Great books at fair prices are waiting for you. Pick up where you left off, or discover something new today.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative mt-6 max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for textbooks, subjects, authors..."
              className="w-full rounded-full pl-11 pr-28 py-3.5 text-sm text-ink bg-white shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-lime"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-brand text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-2 rounded-full transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Quick category chips */}
      <div className="flex flex-wrap gap-2 mt-5">
        {QUICK_CATEGORIES.map(({ label, icon: Icon, param }) => (
          <Link
            key={param}
            to={`/marketplace?category=${param}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white border border-mint-line text-ink px-3.5 py-2 rounded-full hover:bg-mint hover:border-forest/30 hover:text-forest active:scale-95 transition-all"
          >
            <Icon size={14} /> {label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
        {loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={Package} label="Total Orders" value={orderCount} to="/orders" accent />
            <StatCard icon={CheckCircle2} label="Books Purchased" value={purchasedCount} to="/orders" />
            <StatCard icon={Clock} label="Pending Deliveries" value={pendingCount} to="/orders" />
            <StatCard icon={ShoppingBag} label="Cart Items" value={cartCount} to="/cart" />
          </>
        )}
      </div>

      {/* Account + quick actions */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
        <div className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <UserAvatar />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted font-mono">Account</p>
            <p className="text-sm font-semibold text-ink truncate">{email}</p>
          </div>
        </div>

        <Link
          to="/marketplace"
          className="btn-brand text-white font-semibold rounded-2xl p-5 transition flex items-center justify-between group"
        >
          <span className="flex items-center gap-2"><ShoppingBag size={18} /> Browse Books</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/orders"
          className="bg-white border border-mint-line text-ink font-semibold rounded-2xl p-5 hover:bg-mint hover:border-forest/30 transition flex items-center justify-between group"
        >
          <span className="flex items-center gap-2"><PackageSearch size={18} className="text-forest" /> Track My Orders</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent order preview / empty state */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Recent Orders</h2>
          {orders.length > 0 && (
            <Link to="/orders" className="text-xs sm:text-sm font-semibold text-forest hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-mint-line rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-3 w-24 bg-mint rounded" />
                <div className="h-4 w-full bg-mint rounded" />
                <div className="h-3 w-16 bg-mint rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-dashed border-mint-line rounded-2xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-mint text-forest flex items-center justify-center mx-auto mb-4">
              <PackageSearch size={28} />
            </div>
            <p className="font-semibold text-ink">No orders yet</p>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              Once you buy a book, it'll show up here so you can track delivery and view your bill.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 btn-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full mt-5 transition"
            >
              Browse Books <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.slice(0, 3).map((order) => (
              <Link
                key={order._id}
                to="/orders"
                className="bg-white border border-mint-line rounded-2xl p-5 hover:shadow-md hover:shadow-forest/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-mono text-muted truncate">{order.trackingId}</p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      order.orderStatus === "Delivered"
                        ? "bg-forest/10 text-forest"
                        : order.orderStatus === "Cancelled"
                        ? "bg-rose/10 text-rose"
                        : "bg-amber/15 text-amber"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink mt-2 line-clamp-1">
                  {order.books?.[0]?.bookName || "Book order"}
                  {order.books?.length > 1 ? ` +${order.books.length - 1} more` : ""}
                </p>
                <p className="text-xs text-muted mt-1">Amount Paid: ₹{order.totalAmount}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserAvatar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
