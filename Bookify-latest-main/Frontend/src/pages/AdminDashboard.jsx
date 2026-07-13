// Frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import api from "../api/axios";
import BackButton from "../components/BackButton";
import AdminSidebar, { MENU } from "../components/admin/AdminSidebar";
import AdminOverview from "../components/admin/AdminOverview";
import AdminPickups from "../components/admin/AdminPickups";
import AdminSellers from "../components/admin/AdminSellers";
import AdminCustomers from "../components/admin/AdminCustomers";
import AdminBooks from "../components/admin/AdminBooks";
import AdminPayments from "../components/admin/AdminPayments";
import AdminSettings from "../components/admin/AdminSettings";
import NotificationsPage from "./NotificationsPage";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function AdminDashboard() {
  const confirmDialog = useConfirm();
  const toast = useToast();
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pickupsRes, ordersRes, usersRes, analyticsRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/pickups"),
        api.get("/admin/orders"),
        api.get("/admin/users"),
        api.get("/admin/analytics"),
      ]);
      setStats(statsRes.data.stats);
      setPickups(pickupsRes.data.pickups);
      setOrders(ordersRes.data.orders);
      setUsers(usersRes.data.users);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updatePickupStatus = async (pickupId, status) => {
    try {
      await api.patch(`/admin/pickups/${pickupId}/status`, { status });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const markPaid = async (pickupId, paymentMode, transactionId) => {
    try {
      await api.patch(`/admin/pickups/${pickupId}/pay`, { paymentMode, transactionId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  const sendCounterOffer = async (bookId, price, note) => {
    try {
      await api.patch(`/admin/books/${bookId}/counter-offer`, { price, note });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send counter-offer");
    }
  };

  const deletePickup = async (pickup) => {
    const ok = await confirmDialog({
      title: "Delete pickup request?",
      message: "Delete this pickup request and its books?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/pickups/${pickup._id}`);
      fetchData();
      toast.success("Pickup request deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const updatePrice = async (bookId, price) => {
    try {
      await api.patch(`/admin/books/${bookId}/price`, { finalPrice: Number(price) });
      fetchData();
    } catch (err) {
      toast.error("Failed to update price");
    }
  };

  const deleteBook = async (bookId) => {
    const ok = await confirmDialog({
      title: "Delete book?",
      message: "Delete this book?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/books/${bookId}`);
      fetchData();
      toast.success("Book deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete book");
    }
  };

  const updateOrderStatus = async (orderId, orderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { orderStatus });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  const deleteOrder = async (order) => {
    const ok = await confirmDialog({
      title: "Delete order?",
      message: "Delete this order permanently? This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/orders/${order._id}`);
      fetchData();
      toast.success("Order deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  const allBooks = pickups.flatMap((p) =>
    p.books.map((b) => ({ ...b, sellerName: p.seller?.name, sellerId: p.seller?._id }))
  );

  const pageTitle = MENU.find((m) => m.key === active)?.label || "Overview";

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-paper">
      <AdminSidebar
        active={active}
        onSelect={setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-mint-line flex items-center gap-3 px-4 sm:px-6 h-14">
          <button
            className="lg:hidden text-ink p-1.5 -ml-1.5 rounded-lg hover:bg-mint transition"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-ink text-sm sm:text-base flex-1">{pageTitle}</h2>
          <BackButton fallback="/" label="Back" className="hidden sm:inline-flex" />
        </div>

        <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-[1600px] w-full mx-auto">
          {loading ? (
            <div className="text-center text-muted py-16">Loading dashboard...</div>
          ) : error ? (
            <div className="text-center text-rose py-16">{error}</div>
          ) : (
            <>
              {active === "overview" && (
                <AdminOverview stats={stats} analytics={analytics} pickups={pickups} users={users} onNavigate={setActive} />
              )}
              {active === "pickups" && (
                <AdminPickups
                  pickups={pickups}
                  onUpdateStatus={updatePickupStatus}
                  onPay={markPaid}
                  onCounterOffer={sendCounterOffer}
                  onDelete={deletePickup}
                />
              )}
              {active === "sellers" && <AdminSellers users={users} books={allBooks} />}
              {active === "customers" && <AdminCustomers users={users} orders={orders} />}
              {active === "books" && (
                <AdminBooks books={allBooks} onUpdatePrice={updatePrice} onDeleteBook={deleteBook} />
              )}
              {active === "payments" && (
                <AdminPayments orders={orders} onUpdateStatus={updateOrderStatus} onDelete={deleteOrder} />
              )}
              {active === "notifications" && <NotificationsPage />}
              {active === "settings" && <AdminSettings />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}