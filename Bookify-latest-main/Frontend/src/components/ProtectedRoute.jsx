import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

// Wrap a dashboard route with this to make sure only the correct role can
// see it, and that unauthenticated visitors are sent to /login instead of
// a broken/empty dashboard. `allowedRoles` is optional — omit it to just
// require "logged in as anything".
export default function ProtectedRoute({ allowedRoles, children }) {
  const { role, bootstrapped } = useSelector((s) => s.auth);

  // Still trying to restore the session from the persisted token — render
  // nothing yet rather than redirecting prematurely (App.jsx already shows
  // a loading state during this window, but this guards any edge cases).
  if (!bootstrapped) return null;

  if (!role) return <Navigate to="/login" replace />;
  // Logged in, but the wrong role for this route (e.g. a customer typing
  // /sell or /seller into the URL bar) — send them to an explicit
  // Access Denied page rather than kicking them back to /login.
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/access-denied" replace />;

  return children;
}