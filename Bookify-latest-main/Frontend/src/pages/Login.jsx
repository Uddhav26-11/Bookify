import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";
import Logo from "../components/Logo";

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
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Full-bleed background image */}
      <img
        src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&q=75"
        alt="Shelves full of books in a library"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-forest-dark/75 to-ink/85" />

      {/* Centered login card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo className="[&_span]:text-white" />
          <div className="mt-6 w-11 h-11 rounded-xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center text-lime">
            <BookOpen size={20} />
          </div>
          <h1 className="mt-4 text-3xl font-display font-semibold text-white text-center">Buy & sell old books, easily</h1>
          <p className="text-white/70 text-center mt-1.5 text-sm max-w-xs">Log in to list your old books for sale or find second-hand books at a fair price.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/95 backdrop-blur border border-white/40 rounded-2xl shadow-xl shadow-black/20 p-6 space-y-4">
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

        <p className="text-center text-sm text-white/80 mt-6">
          New seller? <Link to="/register/seller" className="text-lime font-semibold">Register</Link> ·{" "}
          New customer? <Link to="/register/customer" className="text-lime font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
}