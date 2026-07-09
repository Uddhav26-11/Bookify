import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import api from "../api/axios";
import { setToken } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-ink text-center">Welcome back</h1>
      <p className="text-muted text-center mt-2 text-sm">Log in to manage your books, orders, or platform.</p>

      <form onSubmit={handleLogin} className="bg-white border border-mint-line rounded-2xl p-6 mt-8 space-y-4">
        <p className="text-xs font-mono font-semibold text-muted uppercase tracking-wide">Login</p>
        <input
          type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
        />
        <input
          type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
        />
        {error && <p className="text-rose text-sm font-medium">{error}</p>}
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
  );
}