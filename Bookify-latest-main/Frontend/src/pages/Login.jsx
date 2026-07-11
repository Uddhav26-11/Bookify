import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";

const features = ["Verified Users", "Secure Platform", "Affordable Books", "Easy Book Selling"];

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
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-paper">
      {/* Left: illustration + brand content (hidden on mobile) */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-center px-10 lg:px-14 py-14 bg-gradient-to-br from-mint via-paper to-lime/20 border-b lg:border-b-0 lg:border-r border-mint-line">
        {/* Background decor */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-mint blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-lime/30 blur-3xl opacity-60 pointer-events-none" />

        <div className="relative animate-fade-up max-w-md mx-auto lg:mx-0">
          <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-forest bg-white px-3 py-1.5 rounded-full mb-6 border border-mint-line shadow-sm">
            📚 Welcome to Bookify
          </span>

          <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-ink">
            Buy, Sell &amp; Exchange<br />
            <span className="text-forest">Used Books</span> Easily
          </h1>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Find affordable second-hand books or sell the books you no longer need. Bookify connects students with students, making education more affordable and sustainable.
          </p>

          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm font-medium text-ink">
                <CheckCircle2 size={16} className="text-forest shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: login form (unchanged fields / logic, refreshed card styling) */}
      <div className="relative flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-mint/30 via-paper to-paper" />
        </div>

        <div className="relative z-10 w-full max-w-sm animate-slide-left">
          <form onSubmit={handleLogin} className="bg-white border border-mint-line rounded-2xl shadow-xl shadow-forest/10 p-7 sm:p-8 space-y-5">
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
              className="w-full bg-forest text-white font-semibold py-2.5 rounded-xl shadow-md shadow-forest/20 hover:bg-forest-dark hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
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