// Frontend/src/components/admin/AdminSidebar.jsx
import {
  LayoutDashboard,
  PackageSearch,
  UserCheck,
  Users,
  BookOpen,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import { notificationsReset } from "../../store/notificationSlice";
import { clearToken } from "../../api/auth";
import api from "../../api/axios";
import Logo from "../Logo";

export const MENU = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "pickups", label: "Pickup Requests", icon: PackageSearch },
  { key: "sellers", label: "Sellers", icon: UserCheck },
  { key: "customers", label: "Customers", icon: Users },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ active, onSelect, mobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => {});
    clearToken();
    dispatch(logout());
    dispatch(notificationsReset());
    navigate("/");
  };

  const handleSelect = (key) => {
    onSelect(key);
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-mint-line z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto lg:flex ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-mint-line shrink-0">
          <Logo />
          <button className="lg:hidden text-muted hover:text-rose" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {MENU.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-forest text-white shadow-sm"
                    : "text-ink/70 hover:bg-mint hover:text-forest"
                }`}
              >
                <item.icon size={17} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-mint-line shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose hover:bg-rose/10 transition-all duration-200"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}