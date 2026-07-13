import { useState } from "react";
import { Trash2, Check, X, Image as ImageIcon, Landmark, Banknote, CreditCard, ExternalLink, Search } from "lucide-react";
import StatusPill from "../StatusPill";
import { useToast } from "../Toast";
import { useConfirm } from "../ConfirmDialog";

const STATUS_OPTIONS = ["Requested", "Assigned", "UnderVerification", "Approved", "Collected", "Paid", "Completed", "Rejected"];

export default function AdminPickups({ pickups, onUpdateStatus, onPay, onCounterOffer, onDelete }) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [previewImages, setPreviewImages] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [offerOpenFor, setOfferOpenFor] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: "", note: "" });
  const [offerSaving, setOfferSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const sendCounterOffer = async (bookId) => {
    if (!offerForm.price || Number(offerForm.price) <= 0) {
      toast.error("Please enter a valid price to offer the seller.");
      return;
    }
    const book = pickups.flatMap((p) => p.books).find((b) => b._id === bookId);
    if (book && Number(offerForm.price) === book.aiEstimatedPrice) {
      const proceed = await confirmDialog({
        title: "Same as AI price",
        message: `This is the same as the AI's price (₹${book.aiEstimatedPrice}). If you agree with the AI price, just use "Approve" instead. Send this as a counter-offer anyway?`,
        confirmLabel: "Send anyway",
        danger: false,
      });
      if (!proceed) return;
    }
    setOfferSaving(true);
    try {
      await onCounterOffer(bookId, Number(offerForm.price), offerForm.note);
      setOfferOpenFor(null);
      setOfferForm({ price: "", note: "" });
    } finally {
      setOfferSaving(false);
    }
  };

  const filtered = pickups.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.seller?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.books.some((b) => b.bookName?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Pickup Requests</h1>
      <p className="text-muted text-sm mb-6">{pickups.length} total pickup requests from sellers.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search seller or book..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-mint-line rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-mint-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-mint-line rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-mint text-left text-xs font-mono text-muted uppercase sticky top-0 z-10">
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
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">No pickup requests found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p._id} className="border-t border-mint-line align-middle hover:bg-mint/40 transition">
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
                          <p className="mt-1 text-forest">✓ Seller accepted ₹{b.finalPrice}</p>
                        )}

                        {b.priceApproval === "Rejected" && (
                          <p className="mt-1 text-rose">Seller rejected the ₹{b.adminOfferedPrice} offer</p>
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
                                    className="flex-1 btn-brand text-white font-semibold rounded px-2 py-1 disabled:opacity-50"
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
                                onClick={() => { setOfferOpenFor(b._id); setOfferForm({ price: "", note: "" }); }}
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
                      onChange={(e) => onUpdateStatus(p._id, e.target.value)}
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
                            onClick={() => onUpdateStatus(p._id, "Approved")}
                            className="flex items-center gap-1 text-xs font-semibold btn-brand text-white px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => onUpdateStatus(p._id, "Rejected")}
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
                        className="flex items-center gap-1 text-xs font-semibold btn-brand text-white px-2.5 py-1.5 rounded-lg transition"
                      >
                        <Banknote size={14} /> Pay Seller
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onDelete(p)} className="text-rose hover:opacity-70" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && (
        <PayModal
          pickup={payModal}
          onClose={() => setPayModal(null)}
          onPay={async (id, mode, txn) => {
            await onPay(id, mode, txn);
            setPayModal(null);
          }}
        />
      )}

      {previewImages && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setPreviewImages(null)}>
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

function PayModal({ pickup, onClose, onPay }) {
  const toast = useToast();
  const [mode, setMode] = useState("Offline");
  const [transactionId, setTransactionId] = useState("");
  const [saving, setSaving] = useState(false);

  const bank = pickup.seller?.bankDetails;
  const hasBank = bank?.isAdded && (bank?.upiId || bank?.accountNumber);
  const totalAmount = pickup.books.reduce((sum, b) => sum + (b.finalPrice || b.aiEstimatedPrice || 0), 0);

  const submit = async () => {
    if (mode === "Online" && !transactionId.trim()) {
      toast.error("Please enter the transaction / UTR reference for the online payment.");
      return;
    }
    setSaving(true);
    await onPay(pickup._id, mode, transactionId.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
        <p className="text-xs text-muted mb-4">{pickup.books.map((b) => b.bookName).join(", ")}</p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("Offline")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition ${
              mode === "Offline" ? "btn-brand text-white border-transparent" : "border-mint-line text-ink"
            }`}
          >
            Cash (COD)
          </button>
          <button
            onClick={() => setMode("Online")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition ${
              mode === "Online" ? "btn-brand text-white border-transparent" : "border-mint-line text-ink"
            }`}
          >
            Online (UPI/Bank)
          </button>
          <button
            onClick={() => setMode("Stripe")}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1 ${
              mode === "Stripe" ? "btn-brand text-white border-transparent" : "border-mint-line text-ink"
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
                  Seller hasn't added bank/UPI details yet. Ask them to add it under "Bank Details" in their
                  dashboard, or pay via Cash (COD) instead.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted block mb-1">Transaction / UTR Reference</label>
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
            <span className="font-semibold text-ink">₹{totalAmount}</span> through Bookify's Stripe account and
            generate a transaction ID + receipt automatically — no manual entry needed.
          </p>
        ) : (
          <p className="text-xs text-muted bg-mint border border-mint-line rounded-xl p-4">
            Mark this as paid once cash has been handed to the seller (e.g. by the pickup executive when the book
            is collected).
          </p>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full mt-5 btn-brand text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : `Confirm ${mode === "Online" ? "Online" : mode === "Stripe" ? "Stripe" : "Cash"} Payment`}
        </button>
      </div>
    </div>
  );
}