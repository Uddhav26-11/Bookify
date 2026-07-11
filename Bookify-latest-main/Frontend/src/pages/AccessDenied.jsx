import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldAlert } from "lucide-react";

// Shown when a logged-in user (e.g. a customer) tries to open a route
// that belongs to a different role (e.g. /sell or /seller) by typing the
// URL directly. Sends them back to the dashboard that matches their role.
export default function AccessDenied() {
  const { role } = useSelector((s) => s.auth);

  const homePath = role === "admin" ? "/admin" : role === "seller" ? "/seller" : "/customer";

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto mb-5">
        <ShieldAlert size={26} />
      </div>
      <h1 className="text-2xl font-bold text-ink">Access Denied</h1>
      <p className="text-muted text-sm mt-2">
        You don't have permission to view this page.
      </p>
      <Link
        to={homePath}
        className="inline-block mt-6 px-5 py-2.5 rounded-full btn-brand text-white text-sm font-semibold transition"
      >
        Back to my Dashboard
      </Link>
    </div>
  );
}