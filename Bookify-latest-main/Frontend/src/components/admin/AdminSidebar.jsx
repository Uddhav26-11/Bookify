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
  ShieldCheck,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import { notificationsReset } from "../../store/notificationSlice";
import { clearToken } from "../../api/auth";
import api from "../../api/axios";

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
        <div className="relative flex items-center justify-between gap-3 px-5 h-16 shrink-0 overflow-hidden bg-gradient-to-r from-[#0E5730] via-[#16A34A] to-[#22C55E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-white" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-display text-[15px] font-bold tracking-tight text-white truncate">
                Bookify Admin
              </p>
              <p className="text-[10px] font-mono tracking-[0.18em] text-white/70 uppercase">
                Control Panel
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-white/80 hover:text-white shrink-0"
            onClick={onCloseMobile}
          >
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
                    ? "bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white shadow-md shadow-[#16A34A]/25"
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