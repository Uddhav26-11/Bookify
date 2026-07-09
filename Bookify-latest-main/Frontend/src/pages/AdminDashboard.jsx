import { useEffect, useState } from "react";
import { Users, UserCheck, BookOpen, Clock, CheckCircle, IndianRupee, Trash2, Check, X, Image as ImageIcon, Package, Landmark, Banknote, CreditCard, ExternalLink } from "lucide-react";
import StatusPill from "../components/StatusPill";
import api from "../api/axios";

const cards = [
  { label: "Total Sellers", key: "totalSellers", icon: Users },
  { label: "Total Customers", key: "totalCustomers", icon: UserCheck },
  { label: "Books Uploaded", key: "booksUploaded", icon: BookOpen },
  { label: "Pending Requests", key: "pendingRequests", icon: Clock },
  { label: "Completed Orders", key: "completedOrders", icon: CheckCircle },
  { label: "Revenue", key: "revenue", icon: IndianRupee, isCurrency: true },
];

const STATUS_OPTIONS = ["Requested", "Assigned", "UnderVerification", "Approved", "Collected", "Paid", "Completed", "Rejected"];
const ORDER_STATUS_OPTIONS = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [pickups, setPickups] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewImages, setPreviewImages] = useState(null); // array of image URLs to show in modal
  const [payModal, setPayModal] = useState(null); // pickup being paid, or null
  const [offerOpenFor, setOfferOpenFor] = useState(null); // bookId with counter-offer form open
  const [offerForm, setOfferForm] = useState({ price: "", note: "" });
  const [offerSaving, setOfferSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pickupsRes, ordersRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/pickups"),
        api.get("/admin/orders"),
      ]);
      setStats(statsRes.data.stats);
      setPickups(pickupsRes.data.pickups);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, orderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { orderStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    }
  };

  const deleteOrder = async (order) => {
    if (!confirm("Delete this order permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/orders/${order._id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (pickupId, status) => {
    try {
      await api.patch(`/admin/pickups/${pickupId}/status`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const markPaid = async (pickupId, paymentMode, transactionId) => {
    try {
      await api.patch(`/admin/pickups/${pickupId}/pay`, { paymentMode, transactionId });
      setPayModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  const sendCounterOffer = async (bookId) => {
    if (!offerForm.price || Number(offerForm.price) <= 0) {
      alert("Please enter a valid price to offer the seller.");
      return;
    }
    const book = pickups.flatMap((p) => p.books).find((b) => b._id === bookId);
    if (book && Number(offerForm.price) === book.aiEstimatedPrice) {
      const proceed = confirm(
        `This is the same as the AI's price (₹${book.aiEstimatedPrice}). If you agree with the AI price, just use "Approve" instead. Send this as a counter-offer anyway?`
      );
      if (!proceed) return;
    }
    setOfferSaving(true);
    try {
      await api.patch(`/admin/books/${bookId}/counter-offer`, {
        price: Number(offerForm.price),
        note: offerForm.note,
      });
      setOfferOpenFor(null);
      setOfferForm({ price: "", note: "" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send counter-offer");
    } finally {
      setOfferSaving(false);
    }
  };

  const deletePickup = async (pickup) => {
    if (!confirm("Delete this pickup request and its books?")) return;
    try {
      // Deletes the PickupRequest itself (and any books still attached to
      // it) in one call. Previously this loop only deleted the child books
      // and set status to "Rejected", never removing the PickupRequest
      // document — so an already-Rejected request with no books left
      // looked "stuck" and never disappeared from the table.
      await api.delete(`/admin/pickups/${pickup._id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const updatePrice = async (bookId, price) => {
    try {
      await api.patch(`/admin/books/${bookId}/price`, { finalPrice: Number(price) });
      fetchData();
    } catch (err) {
      alert("Failed to update price");
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-10 text-center text-muted">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-6 py-10 text-center text-rose">{error}</div>;
  }

  // Flatten all books across all pickups for the "Inventory" table
  const allBooks = pickups.flatMap((p) => p.books.map((b) => ({ ...b, sellerName: p.seller?.name })));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-ink">Admin Dashboard</h1>
      <p className="text-muted text-sm mt-1">Platform-wide overview and controls.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {cards.map((c) => (
          <div key={c.key} className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted font-mono">{c.label}</p>
              <p className="text-2xl font-semibold text-ink">
                {c.isCurrency
                  ? `₹${(stats[c.key] || 0).toLocaleString("en-IN")}`
                  : (stats[c.key] || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-bold text-lg text-ink mb-3">Pickup Requests</h2>
        <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Pickup Address</th>
                <th className="px-4 py-3">Books &amp; AI Price</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update Status</th>
                <th className="px-4 py-3">Quick Action</th>
                <th className="px-4 py-3">Payout</th>
                <th className="px-4 py-3">Delete</th>
              </tr>
            </thead>
            <tbody>
              {pickups.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-muted">No pickup requests yet.</td></tr>
              ) : pickups.map((p) => (
                <tr key={p._id} className="border-t border-mint-line align-middle">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.seller?.name || "Unknown"}</p>
                    <p className="text-xs text-muted">{p.seller?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted max-w-[160px]">
                    {p.seller?.address || p.seller?.city || p.seller?.pincode ? (
                      <>
                        {p.seller?.address && <p>{p.seller.address}</p>}
                        <p>{[p.seller?.city, p.seller?.pincode].filter(Boolean).join(" - ")}</p>
                      </>
                    ) : (
                      <span>No address on file</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.books.map((b) => (
                      <div key={b._id} className="text-xs mb-2.5 pb-2.5 border-b border-mint-line last:border-0 last:mb-0 last:pb-0">
                        <p>{b.bookName} <span className="text-muted">({b.condition})</span></p>
                        <p className="text-forest font-semibold">
                          AI: ₹{b.aiEstimatedPrice || 0}
                          {b.sellerProposedPrice > 0 && (
                            <span className="text-muted font-normal"> · Seller asked: ₹{b.sellerProposedPrice}</span>
                          )}
                        </p>

                        {b.priceApproval === "Pending" && (
                          <p className="mt-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                            Offered ₹{b.adminOfferedPrice} — waiting for seller's response
                            {b.adminNote && <span className="block text-muted italic mt-0.5">"{b.adminNote}"</span>}
                          </p>
                        )}

                        {b.priceApproval === "Accepted" && (
                          <p className="mt-1 text-forest">
                            ✓ Seller accepted ₹{b.finalPrice}
                          </p>
                        )}

                        {b.priceApproval === "Rejected" && (
                          <p className="mt-1 text-rose">
                            Seller rejected the ₹{b.adminOfferedPrice} offer
                          </p>
                        )}

                        {b.priceApproval !== "Pending" && b.priceApproval !== "Accepted" && (
                          <>
                            {offerOpenFor === b._id ? (
                              <div className="mt-1.5 bg-mint border border-mint-line rounded-lg p-2 space-y-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  autoFocus
                                  placeholder={`Your price (AI said ₹${b.aiEstimatedPrice || 0})`}
                                  value={offerForm.price}
                                  onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                                  className="w-full border border-mint-line rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                                />
                                <input
                                  type="text"
                                  placeholder="Why? e.g. cover is torn (optional)"
                                  value={offerForm.note}
                                  onChange={(e) => setOfferForm({ ...offerForm, note: e.target.value })}
                                  className="w-full border border-mint-line rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                                />
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => sendCounterOffer(b._id)}
                                    disabled={offerSaving}
                                    className="flex-1 bg-forest text-white font-semibold rounded px-2 py-1 disabled:opacity-50"
                                  >
                                    {offerSaving ? "Sending..." : "Send to Seller"}
                                  </button>
                                  <button
                                    onClick={() => { setOfferOpenFor(null); setOfferForm({ price: "", note: "" }); }}
                                    className="border border-mint-line rounded px-2 py-1 text-ink"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setOfferOpenFor(b._id);
                                  setOfferForm({ price: "", note: "" });
                                }}
                                className="mt-1 text-[11px] font-semibold text-forest hover:underline"
                              >
                                {b.priceApproval === "Rejected" ? "Send a new offer" : "Price looks off? Counter-offer"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    {p.books.some((b) => b.images?.length > 0) ? (
                      <button
                        onClick={() => setPreviewImages(p.books.flatMap((b) => b.images))}
                        className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                      >
                        <ImageIcon size={14} /> View Photos
                      </button>
                    ) : (
                      <span className="text-xs text-muted">No photos</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p._id, e.target.value)}
                      className="border border-mint-line rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {(p.status === "Requested" || p.status === "UnderVerification") ? (
                      p.books.some((b) => b.priceApproval === "Pending") ? (
                        <span className="text-[11px] text-muted italic">Waiting on seller's price response</span>
                      ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(p._id, "Approved")}
                          className="flex items-center gap-1 text-xs font-semibold bg-forest text-white px-2.5 py-1.5 rounded-lg hover:bg-forest-dark transition"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(p._id, "Rejected")}
                          className="flex items-center gap-1 text-xs font-semibold border border-mint-line px-2.5 py-1.5 rounded-lg hover:bg-mint transition"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                      )
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "Paid" || p.status === "Completed" ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-forest flex items-center gap-1">
                          <Check size={14} /> Paid ({p.paymentMode || "—"})
                        </span>
                        {p.paymentMode === "Stripe" && p.stripeReceiptUrl && (
                          <a
                            href={p.stripeReceiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted hover:text-forest flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> View Stripe receipt
                          </a>
                        )}
                      </div>
                    ) : ["Approved", "Collected"].includes(p.status) ? (
                      <button
                        onClick={() => setPayModal(p)}
                        className="flex items-center gap-1 text-xs font-semibold bg-forest text-white px-2.5 py-1.5 rounded-lg hover:bg-forest-dark transition"
                      >
                        <Banknote size={14} /> Pay Seller
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deletePickup(p)} className="text-rose hover:opacity-70" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && <PayModal pickup={payModal} onClose={() => setPayModal(null)} onPay={markPaid} />}

      <div className="mt-10">
        <h2 className="font-bold text-lg text-ink mb-3 flex items-center gap-2">
          <Package size={18} /> Customer Orders & Delivery Tracking
        </h2>
        <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Books</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update Delivery Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No orders yet.</td></tr>
              ) : orders.map((o) => (
                <tr key={o._id} className="border-t border-mint-line align-middle">
                  <td className="px-4 py-3 font-mono text-xs text-forest font-semibold">{o.trackingId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{o.customer?.name}</p>
                    <p className="text-xs text-muted">{o.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{o.books.map((b) => b.bookName).join(", ")}</td>
                  <td className="px-4 py-3 font-semibold text-forest">₹{o.totalAmount}</td>
                  <td className="px-4 py-3"><StatusPill status={o.orderStatus} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                      className="border border-mint-line rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteOrder(o)} className="text-rose hover:opacity-70" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-bold text-lg text-ink mb-3">Inventory (Approved Books)</h2>
        <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3">Tracking Code</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Final Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {allBooks.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No books yet.</td></tr>
              ) : allBooks.map((b) => (
                <tr key={b._id} className="border-t border-mint-line">
                  <td className="px-4 py-3">{b.bookName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-forest">{b.trackingId}</td>
                  <td className="px-4 py-3 text-muted">{b.sellerName}</td>
                  <td className="px-4 py-3 font-mono">{b.condition}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={b.finalPrice || b.aiEstimatedPrice || 0}
                      onBlur={(e) => updatePrice(b._id, e.target.value)}
                      className="w-24 border border-mint-line rounded-lg px-2 py-1 text-sm font-semibold text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </td>
                  <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewImages && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewImages(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-ink">Book Photos</h3>
              <button onClick={() => setPreviewImages(null)} className="text-muted hover:text-rose"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previewImages.map((src, i) => (
                <img key={i} src={src} alt="" className="w-full h-40 object-cover rounded-xl border border-mint-line" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lets the admin pay a seller either Online (using the seller's UPI/bank
// details, with a transaction/UTR reference for proof) or Offline / Cash on
// Delivery (e.g. the pickup executive hands over cash when collecting the
// book) — bank details are optional for the seller, so COD always works.
function PayModal({ pickup, onClose, onPay }) {
  const [mode, setMode] = useState("Offline");
  const [transactionId, setTransactionId] = useState("");
  const [saving, setSaving] = useState(false);

  const bank = pickup.seller?.bankDetails;
  const hasBank = bank?.isAdded && (bank?.upiId || bank?.accountNumber);
  const totalAmount = pickup.books.reduce(
    (sum, b) => sum + (b.finalPrice || b.aiEstimatedPrice || 0),
    0
  );

  const submit = async () => {
    if (mode === "Online" && !transactionId.trim()) {
      alert("Please enter the transaction / UTR reference for the online payment.");
      return;
    }
    setSaving(true);
    await onPay(pickup._id, mode, transactionId.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Banknote size={18} className="text-forest" /> Pay {pickup.seller?.name || "Seller"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-rose">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink mb-1">
          Amount: <span className="font-semibold text-forest">₹{totalAmount}</span>
        </p>
        <p className="text-xs text-muted mb-4">
          {pickup.books.map((b) => b.bookName).join(", ")}
        </p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("Offline")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition ${
              mode === "Offline" ? "bg-forest text-white border-forest" : "border-mint-line text-ink"
            }`}
          >
            Cash (COD)
          </button>
          <button
            onClick={() => setMode("Online")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition ${
              mode === "Online" ? "bg-forest text-white border-forest" : "border-mint-line text-ink"
            }`}
          >
            Online (UPI/Bank)
          </button>
          <button
            onClick={() => setMode("Stripe")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1 ${
              mode === "Stripe" ? "bg-forest text-white border-forest" : "border-mint-line text-ink"
            }`}
          >
            <CreditCard size={13} /> Pay via Stripe
          </button>
        </div>

        {mode === "Online" ? (
          <div className="space-y-3">
            <div className="bg-mint border border-mint-line rounded-xl p-4 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-ink mb-2">
                <Landmark size={14} className="text-forest" /> Seller's Payout Details
              </p>
              {hasBank ? (
                <div className="space-y-1 text-muted">
                  {bank.upiId && <p><span className="text-ink font-medium">UPI ID:</span> {bank.upiId}</p>}
                  {bank.accountHolderName && <p><span className="text-ink font-medium">Account Holder:</span> {bank.accountHolderName}</p>}
                  {bank.accountNumber && <p><span className="text-ink font-medium">Account No.:</span> {bank.accountNumber}</p>}
                  {bank.ifscCode && <p><span className="text-ink font-medium">IFSC:</span> {bank.ifscCode}</p>}
                  {bank.bankName && <p><span className="text-ink font-medium">Bank:</span> {bank.bankName}</p>}
                </div>
              ) : (
                <p className="text-rose">
                  Seller hasn't added bank/UPI details yet. Ask them to add it under
                  "Bank Details" in their dashboard, or pay via Cash (COD) instead.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted block mb-1">
                Transaction / UTR Reference
              </label>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UPI ref no. after paying above"
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>
        ) : mode === "Stripe" ? (
          <p className="text-xs text-muted bg-mint border border-mint-line rounded-xl p-4">
            Confirming will create a real Stripe (test mode) payment of{" "}
            <span className="font-semibold text-ink">₹{totalAmount}</span> through Bookify's Stripe
            account and generate a transaction ID + receipt automatically — no manual entry needed.
          </p>
        ) : (
          <p className="text-xs text-muted bg-mint border border-mint-line rounded-xl p-4">
            Mark this as paid once cash has been handed to the seller (e.g. by the pickup executive
            when the book is collected).
          </p>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full mt-5 bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition disabled:opacity-50"
        >
          {saving ? "Saving..." : `Confirm ${mode === "Online" ? "Online" : mode === "Stripe" ? "Stripe" : "Cash"} Payment`}
        </button>
      </div>
    </div>
  );
}