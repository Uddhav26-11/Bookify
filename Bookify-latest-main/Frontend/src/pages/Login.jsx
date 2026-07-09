import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, BookOpen, Users, Globe2, ShieldCheck } from "lucide-react";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";
import Logo from "../components/Logo";

const stats = [
  { icon: BookOpen, label: "Books listed", value: "40M+" },
  { icon: Users, label: "Active sellers", value: "500K+" },
  { icon: Globe2, label: "Cities served", value: "1,000+" },
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

      // Persist the JWT so a page refresh (or reopening the tab) restores
      // the session instead of logging the user out.
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
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      {/* Left: illustration panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=75"
          alt="Shelves full of books in a library"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Brand-tinted overlay so the photo reads as part of Bookify, not a generic stock shot */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-forest-dark/80 to-forest/60" />

        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14">
          <Logo className="[&_span]:text-white" />

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-lime bg-white/10 border border-white/15 backdrop-blur px-3 py-1 rounded-full mb-6">
              <ShieldCheck size={12} /> Trusted by book lovers everywhere
            </span>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.08] text-white">
              Find any book,<br /> at half the price.
            </h1>
            <p className="mt-4 text-white/75 text-base leading-relaxed max-w-sm">
              Buy and sell second-hand books with AI-graded condition, fair pricing, and doorstep pickup — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/15 backdrop-blur rounded-xl px-4 py-3">
                <s.icon size={16} className="text-lime mb-2" />
                <p className="font-display text-lg font-semibold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-white/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center px-6 py-16 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <h2 className="text-3xl font-display font-semibold text-ink text-center lg:text-left">Welcome back</h2>
          <p className="text-muted text-center lg:text-left mt-2 text-sm">Log in to manage your books, orders, or platform.</p>

          <form onSubmit={handleLogin} className="bg-white border border-mint-line rounded-2xl shadow-sm shadow-forest/5 p-6 mt-8 space-y-4">
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
              className="w-full bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            New seller? <Link to="/register/seller" className="text-forest font-semibold">Register</Link> ·{" "}
            New customer? <Link to="/register/customer" className="text-forest font-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}