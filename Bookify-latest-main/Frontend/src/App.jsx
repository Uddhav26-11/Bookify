import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SellerRegister from "./pages/SellerRegister";
import CustomerRegister from "./pages/CustomerRegister";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import Marketplace from "./pages/Marketplace";
import BookDetails from "./pages/BookDetails";
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import NotificationsPage from "./pages/NotificationsPage";
import AccessDenied from "./pages/AccessDenied";
import useNotificationSocket from "./hooks/useNotificationSocket";
import { fetchCurrentUser, getToken } from "./api/auth";
import { login, authBootstrapped } from "./store/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmDialog";

export default function App() {
  const dispatch = useDispatch();
  const [restoring, setRestoring] = useState(true);

  // On every app startup (including a hard refresh), restore the logged-in
  // user from the JWT persisted in localStorage — validating it against the
  // backend (GET /auth/me) rather than trusting it blindly — so refreshing
  // a dashboard never logs the user out. If there's no token, or the
  // backend says it's expired/invalid, we just fall through to "logged
  // out" and any protected page/route will send them to /login.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (getToken()) {
        const user = await fetchCurrentUser();
        if (!cancelled && user) {
          dispatch(login({ role: user.role, name: user.name, email: user.email, id: user.id }));
        }
      }
      if (!cancelled) {
        dispatch(authBootstrapped());
        setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the notification bell live (Socket.IO connect/reconnect + Redux
  // sync) for whichever dashboard/page is currently mounted. Waiting on
  // `restoring` avoids briefly connecting as "logged out" before the
  // session-restore check above has had a chance to run.
  useNotificationSocket();

  if (restoring) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <div className="min-h-screen flex items-center justify-center text-muted text-sm">
            Loading…
          </div>
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/seller" element={<SellerRegister />} />
              <Route path="/register/customer" element={<CustomerRegister />} />
              <Route
                path="/sell"
                element={
                  <ProtectedRoute allowedRoles={["seller"]}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller"
                element={
                  <ProtectedRoute allowedRoles={["seller"]}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/book/:id" element={<BookDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}