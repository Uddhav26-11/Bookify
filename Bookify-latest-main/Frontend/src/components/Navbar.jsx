import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ShoppingCart, LogOut } from "lucide-react";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { logout } from "../store/authSlice";
import { notificationsReset } from "../store/notificationSlice";
import { clearToken } from "../api/auth";
import api from "../api/axios";

export default function Navbar() {
  const { role, name } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleHowItWorks = (e) => {
    e.preventDefault();
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-mint-line">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/"><Logo /></Link>

        {role !== "admin" && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink/80">
            {role === "customer" && (
              <Link to="/orders" className="hover:text-forest transition">My Orders</Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {role === "customer" && (
            <Link to="/cart" className="relative">
              <ShoppingCart size={20} className="text-ink" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-forest text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
              )}
            </Link>
          )}
          {role && <NotificationBell />}
          {role ? (
            <div className="flex items-center gap-3">
              <Link
                to={role === "admin" ? "/admin" : role === "seller" ? "/seller" : "/customer"}
                className="text-sm font-medium text-ink hidden sm:block"
              >
                Hi, {name}
              </Link>
              <button
                onClick={() => {
                  api.post("/auth/logout").catch(() => {});
                  clearToken();
                  dispatch(logout());
                  dispatch(notificationsReset());
                  navigate("/");
                }}
                className="text-sm flex items-center gap-1 text-muted hover:text-rose transition"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-full bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}