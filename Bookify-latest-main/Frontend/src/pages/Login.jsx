import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Eye, EyeOff, Sparkles, BookOpen, GraduationCap, Repeat, Package,
  ShoppingBag, Truck, CheckCircle2, CreditCard, Leaf,
} from "lucide-react";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";

const trustIndicators = ["Verified Sellers", "Secure Payments", "Fast Pickup", "Affordable Prices"];

const featureChips = [
  { icon: Package, label: "Free Pickup" },
  { icon: CreditCard, label: "Secure Payment" },
  { icon: Leaf, label: "Eco Friendly" },
];

const floatingCards = [
  { icon: BookOpen, label: "Stack of Books", tone: "bg-mint text-forest", pos: "top-0 left-4", tilt: "-4deg", delay: "0s" },
  { icon: GraduationCap, label: "Student Reading", tone: "bg-forest text-white", pos: "top-6 right-0", tilt: "3deg", delay: "0.4s" },
  { icon: Repeat, label: "Book Exchange", tone: "bg-white text-forest", pos: "top-40 left-0", tilt: "2deg", delay: "0.8s" },
  { icon: Package, label: "Delivery Box", tone: "bg-lime/60 text-forest-dark", pos: "top-48 right-8", tilt: "-3deg", delay: "1.2s" },
  { icon: ShoppingBag, label: "Online Marketplace", tone: "bg-white text-forest", pos: "top-80 left-10", tilt: "4deg", delay: "0.6s" },
  { icon: Truck, label: "Book Pickup", tone: "bg-forest-dark text-white", pos: "top-[21rem] right-2", tilt: "-2deg", delay: "1s" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      const { user, token } = res.data;

      setToken(token);
      dispatch(login({ role: user.role, name: user.name, email: user.email, id: user.id }));

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "seller") navigate("/seller");
      else navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-fit py-14 lg:min-h-[85vh] xl:min-h-[90vh] lg:py-16 flex items-center bg-paper">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-mint/60 via-paper to-paper" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-mint blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-lime/30 blur-3xl opacity-60" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(var(--color-forest) 1px, transparent 1px), linear-gradient(90deg, var(--color-forest) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <BookOpen className="hidden lg:block absolute top-16 left-1/2 text-forest/20 animate-float-icon" size={30} />
        <Sparkles className="hidden lg:block absolute bottom-24 left-1/3 text-lime/60 animate-float-icon" size={22} style={{ animationDelay: "1.5s" }} />
        <BookOpen className="hidden lg:block absolute bottom-12 right-1/4 text-forest/15 animate-float-icon" size={26} style={{ animationDelay: "2.2s" }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left: branding content */}
        <div className="animate-fade-up text-center lg:text-left">
          <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-forest bg-mint px-3 py-1.5 rounded-full mb-6 border border-mint-line">
            📚 India's Smart Used Book Marketplace
          </span>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight text-ink">
            Buy &amp; Sell <span className="text-forest">Used Books</span><br />
            Save Money. <span className="text-forest">Save Trees.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-md leading-relaxed mx-auto lg:mx-0">
            Bookify helps students buy affordable second-hand books and sell old books in just a few clicks. Every book finds a new reader instead of collecting dust.
          </p>

          <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
            {trustIndicators.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-sm text-muted font-medium">
                <CheckCircle2 size={15} className="text-forest" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
            {featureChips.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest bg-white border border-mint-line px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <f.icon size={14} /> {f.label}
              </span>
            ))}
          </div>

          {/* Floating illustration cards (desktop only) */}
          <div className="relative hidden lg:block h-64 mt-10">
            {floatingCards.slice(0, 3).map((c) => (
              <div
                key={c.label}
                className={`absolute ${c.pos} w-36 rounded-2xl border border-white/60 shadow-xl backdrop-blur bg-white/80 p-4 animate-float-card`}
                style={{ "--tilt": c.tilt, animationDelay: c.delay }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.tone}`}>
                  <c.icon size={18} />
                </div>
                <p className="text-xs font-semibold text-ink leading-snug">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: login form */}
        <div className="relative animate-slide-left w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <form onSubmit={handleLogin} className="bg-white/95 backdrop-blur border border-mint-line rounded-2xl shadow-xl shadow-forest/10 p-6 space-y-4">
            <p className="text-xs font-mono font-semibold text-muted uppercase tracking-wide">Login</p>

            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Email</label>
              <input
                type="email" required placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-mint-line rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-forest transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose text-sm font-medium bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-forest/20 hover:bg-forest-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/30 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            New seller? <Link to="/register/seller" className="text-forest font-semibold">Register</Link> ·{" "}
            New customer? <Link to="/register/customer" className="text-forest font-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}