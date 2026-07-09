import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Upload, Sparkles, Check, X, Plus, Trash2, Landmark, CheckCircle, IndianRupee, BookOpen, Clock } from "lucide-react";
import StatusPill from "../components/StatusPill";
import { getAIEstimate } from "../data/aiPricing";
import api from "../api/axios";
import { getSocket } from "../api/socket";

const TABS = ["Upload Book", "Track Requests", "My Sales", "Payment History", "Bank Details"];

const STAT_CARDS = [
  { label: "Completed Orders", key: "completedOrders", icon: CheckCircle },
  { label: "Revenue", key: "revenue", icon: IndianRupee, isCurrency: true },
  { label: "Books Sold", key: "booksSold", icon: BookOpen },
  { label: "Pending Orders", key: "pendingOrders", icon: Clock },
];

// Live seller stats (Completed Orders, Revenue, Books Sold, Pending Orders)
// pulled fresh from GET /api/seller/dashboard every time this mounts — i.e.
// on every page load/refresh — so the numbers always reflect the database
// and never get stuck at a stale/zero value from a previous render.
function SellerStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    api
      .get("/seller/dashboard")
      .then((res) => setStats(res.data.stats))
      .catch(() => setStats((prev) => prev || { completedOrders: 0, revenue: 0, booksSold: 0, pendingOrders: 0 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();

    // A customer buying one of this seller's books fires a "New Order"
    // notification (see notificationService/orderController) — use that as
    // the live trigger to re-pull stats from the DB instead of requiring a
    // manual page refresh.
    const socket = getSocket();
    if (!socket) return;
    const onNewNotification = (n) => {
      if (n?.type === "ORDER_PLACED") loadStats();
    };
    socket.on("notification:new", onNewNotification);
    return () => socket.off("notification:new", onNewNotification);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {STAT_CARDS.map((c) => (
        <div key={c.key} className="bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
            <c.icon size={20} />
          </div>
          <div>
            <p className="text-xs text-muted font-mono">{c.label}</p>
            <p className="text-2xl font-semibold text-ink">
              {loading
                ? "…"
                : c.isCurrency
                ? `₹${(stats?.[c.key] || 0).toLocaleString("en-IN")}`
                : (stats?.[c.key] || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SellerDashboard() {
  const [tab, setTab] = useState("Upload Book");

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-ink">Seller Dashboard</h1>
      <p className="text-muted text-sm mt-1">Upload books, track pickup requests, and view your payments.</p>

      <div className="mt-6">
        <SellerStats />
      </div>

      <div className="flex gap-2 mt-2 border-b border-mint-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t ? "border-forest text-forest" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Upload Book" && <UploadBook />}
        {tab === "Track Requests" && <TrackRequests />}
        {tab === "My Sales" && <MySales />}
        {tab === "Payment History" && <PaymentHistory />}
        {tab === "Bank Details" && <BankDetails />}
      </div>
    </div>
  );
}

function UploadBook() {
  const [mode, setMode] = useState("single"); // "single" | "bulk"

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "single" ? "bg-forest text-white" : "bg-white border border-mint-line text-ink"
          }`}
        >
          Single Book
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "bulk" ? "bg-forest text-white" : "bg-white border border-mint-line text-ink"
          }`}
        >
          Bulk Upload (Multiple Books)
        </button>
      </div>

      {mode === "single" ? <SingleBookUpload /> : <BulkBookUpload />}
    </div>
  );
}

function SingleBookUpload() {
  const [form, setForm] = useState({ name: "", cls: "", board: "", subject: "", author: "", publication: "", condition: "Good", sellerPrice: "" });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");

  // Photos are often picked one at a time (e.g. mobile camera), so each
  // selection is APPENDED to the existing set instead of replacing it.
  // Duplicate files (same name+size) are skipped, and the list is capped at 4.
  const onFile = (e) => {
    const incoming = Array.from(e.target.files);
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of incoming) {
        if (merged.length >= 4) break;
        const isDup = merged.some((m) => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified);
        if (!isDup) merged.push(f);
      }
      setPreviews(merged.map((f) => URL.createObjectURL(f)));
      return merged;
    });
    // Reset the input value so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (files.length !== 4) {
      setError("Please upload exactly 4 photos (cover, back, spine, and any damage).");
      return;
    }

    setLoading(true);
    setEstimate(null);
    setDecision(null);
    try {
      const result = await getAIEstimate({ form, files, sellerPrice: form.sellerPrice });
      setEstimate(result);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get an AI price estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async () => {
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("bookName", form.name);
      fd.append("class", form.cls);
      fd.append("board", form.board);
      fd.append("subject", form.subject);
      fd.append("author", form.author);
      fd.append("publication", form.publication);
      fd.append("condition", form.condition);
      fd.append("aiEstimatedPrice", estimate.priceEstimate);
      fd.append("confidenceScore", estimate.confidence);
      if (form.sellerPrice) fd.append("sellerProposedPrice", form.sellerPrice);
      // Photos were already analyzed and uploaded to Cloudinary during the
      // AI estimate step — reuse those URLs instead of re-uploading.
      fd.append("imageUrls", JSON.stringify(estimate.imageUrls));

      await api.post("/books/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDecision("accepted");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={submit} className="bg-white border border-mint-line rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Book Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Class" value={form.cls} onChange={(v) => setForm({ ...form, cls: v })} />
          <Field label="Board" value={form.board} onChange={(v) => setForm({ ...form, board: v })} />
          <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <Field label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
          <Field label="Publication" value={form.publication} onChange={(v) => setForm({ ...form, publication: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
            >
              {["Poor", "Fair", "Good", "Excellent"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Your Asking Price (₹) — optional</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 150"
              value={form.sellerPrice}
              onChange={(e) => setForm({ ...form, sellerPrice: e.target.value })}
              className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Photos — exactly 4 required</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-mint-line rounded-xl py-8 cursor-pointer hover:bg-mint transition">
            <Upload size={20} className="text-forest" />
            <span className="text-sm text-muted">Upload cover, back, spine, and any damage (4 photos, one at a time or together)</span>
            <input type="file" accept="image/*" multiple onChange={onFile} className="hidden" />
          </label>
          <p className={`text-xs mt-2 font-medium ${files.length === 4 ? "text-forest" : "text-muted"}`}>
            {files.length}/4 photos selected
          </p>
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-mint-line" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 bg-rose text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-rose text-sm font-medium">{error}</p>}
        <button
          type="submit"
          disabled={loading || files.length !== 4}
          className="w-full bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> {loading ? "Analyzing photos..." : "Get AI Price Estimate"}
        </button>
      </form>

      <div className="bg-mint border border-mint-line rounded-2xl p-6 flex flex-col">
        <h3 className="font-bold text-lg text-ink mb-4">AI Pricing Result</h3>
        {!estimate && !loading && (
          <p className="text-sm text-muted flex-1 flex items-center justify-center text-center">
            Upload photos and submit the form to see your instant estimate here.
          </p>
        )}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted text-sm">
            <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
            Scanning cover condition, corners, and binding...
          </div>
        )}
        {estimate && !loading && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-xs font-mono text-muted">Estimated Selling Price</p>
              <p className="text-4xl font-bold text-ink">₹{estimate.priceEstimate}</p>
              <p className="text-xs text-muted mt-1">Confidence: {estimate.confidence}%</p>
            </div>
            {estimate.verdict && (
              <div
                className={`rounded-lg p-3 text-xs font-medium border ${
                  estimate.verdict === "fair"
                    ? "bg-white border-forest/30 text-forest"
                    : "bg-white border-rose/30 text-rose"
                }`}
              >
                {estimate.verdict === "too_high" && "⬇ Your price looks a bit high — "}
                {estimate.verdict === "too_low" && "⬆ Your price looks a bit low — "}
                {estimate.verdict === "fair" && "✓ Fair price — "}
                {estimate.verdictNote}
              </div>
            )}
            <p className="text-[11px] text-muted italic border-t border-mint-line pt-3">
              This is an AI-generated estimate. Final price may increase or decrease after physical inspection.
            </p>
            {error && <p className="text-rose text-sm font-medium text-center">{error}</p>}
            {!decision ? (
              <div className="flex gap-3">
                <button
                  onClick={acceptOffer}
                  disabled={submitting}
                  className="flex-1 bg-forest text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} /> {submitting ? "Submitting..." : "Accept Offer"}
                </button>
                <button
                  onClick={() => setDecision("rejected")}
                  disabled={submitting}
                  className="flex-1 border border-mint-line font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-ink"
                >
                  <X size={16} /> Reject Offer
                </button>
              </div>
            ) : decision === "accepted" ? (
              <div className="bg-white border border-mint-line rounded-lg p-3 text-sm text-forest font-medium text-center">
                Offer accepted — pickup request created. Status: <StatusPill status="Requested" />
              </div>
            ) : (
              <p className="text-center text-sm text-muted">Offer declined. You can re-submit with new photos anytime.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BulkBookUpload() {
  const emptyBook = () => ({ bookName: "", class: "", board: "", subject: "", author: "", publication: "", condition: "Good", files: [], previews: [] });
  const [books, setBooks] = useState([emptyBook()]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const updateBook = (index, key, value) => {
    setBooks((prev) => prev.map((b, i) => (i === index ? { ...b, [key]: value } : b)));
  };

  const onFile = (index, e) => {
    const incoming = Array.from(e.target.files);
    setBooks((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const merged = [...b.files];
        for (const f of incoming) {
          if (merged.length >= 4) break;
          const isDup = merged.some((m) => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified);
          if (!isDup) merged.push(f);
        }
        return { ...b, files: merged, previews: merged.map((f) => URL.createObjectURL(f)) };
      })
    );
    e.target.value = "";
  };

  const removeBookFile = (index, fileIndex) => {
    setBooks((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const merged = b.files.filter((_, j) => j !== fileIndex);
        return { ...b, files: merged, previews: merged.map((f) => URL.createObjectURL(f)) };
      })
    );
  };

  const addBook = () => setBooks((prev) => [...prev, emptyBook()]);
  const removeBook = (index) => setBooks((prev) => prev.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const badBook = books.findIndex((b) => b.files.length !== 4);
    if (badBook !== -1) {
      setError(`Book ${badBook + 1} needs exactly 4 photos (currently ${books[badBook].files.length}).`);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      const metadata = books.map(({ bookName, class: cls, board, subject, author, publication, condition }) => ({
        bookName, class: cls, board, subject, author, publication, condition,
      }));
      fd.append("books", JSON.stringify(metadata));

      books.forEach((b, i) => {
        b.files.forEach((file) => fd.append(`images_${i}`, file));
      });

      await api.post("/books/bulk-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setBooks([emptyBook()]);
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white border border-mint-line rounded-2xl p-10 text-center">
        <p className="text-forest font-semibold">All books submitted successfully! Pickup request created.</p>
        <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-forest font-semibold underline">
          Upload more books
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {books.map((b, i) => (
        <div key={i} className="bg-white border border-mint-line rounded-2xl p-6 space-y-4 relative">
          <div className="flex justify-between items-center">
            <p className="text-xs font-mono font-semibold text-muted uppercase">Book {i + 1}</p>
            {books.length > 1 && (
              <button type="button" onClick={() => removeBook(i)} className="text-rose hover:opacity-70">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Book Name" value={b.bookName} onChange={(v) => updateBook(i, "bookName", v)} />
            <Field label="Class" value={b.class} onChange={(v) => updateBook(i, "class", v)} />
            <Field label="Board" value={b.board} onChange={(v) => updateBook(i, "board", v)} />
            <Field label="Subject" value={b.subject} onChange={(v) => updateBook(i, "subject", v)} />
            <Field label="Author" value={b.author} onChange={(v) => updateBook(i, "author", v)} />
            <Field label="Publication" value={b.publication} onChange={(v) => updateBook(i, "publication", v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Condition</label>
            <select
              value={b.condition}
              onChange={(e) => updateBook(i, "condition", e.target.value)}
              className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
            >
              {["Poor", "Fair", "Good", "Excellent"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Photos — exactly 4 required</label>
            <input type="file" accept="image/*" multiple onChange={(e) => onFile(i, e)} className="text-sm" />
            <p className={`text-xs mt-2 font-medium ${b.files.length === 4 ? "text-forest" : "text-muted"}`}>
              {b.files.length}/4 photos selected
            </p>
            {b.previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {b.previews.map((src, j) => (
                  <div key={j} className="relative">
                    <img src={src} alt="" className="w-14 h-14 object-cover rounded-lg border border-mint-line" />
                    <button
                      type="button"
                      onClick={() => removeBookFile(i, j)}
                      className="absolute -top-2 -right-2 bg-rose text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBook}
        className="flex items-center gap-2 text-sm font-semibold text-forest border border-mint-line rounded-lg px-4 py-2 hover:bg-mint transition"
      >
        <Plus size={16} /> Add Another Book
      </button>

      {error && <p className="text-rose text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition disabled:opacity-50"
      >
        {submitting ? "Submitting all books..." : `Submit ${books.length} Book(s)`}
      </button>
    </form>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted block mb-1">{label}</label>
      <input
        required value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
      />
    </div>
  );
}

function TrackRequests() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null); // bookId currently submitting

  const load = () => {
    setLoading(true);
    api.get("/pickup/my-pickups")
      .then((res) => setPickups(res.data.pickups))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (bookId, action) => {
    setRespondingTo(bookId);
    try {
      await api.patch(`/seller/books/${bookId}/counter-offer-response`, { action });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond to offer");
    } finally {
      setRespondingTo(null);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading...</p>;

  if (pickups.length === 0) {
    return (
      <div className="bg-white border border-mint-line rounded-2xl p-10 text-center text-sm text-muted">
        You haven't submitted any pickup requests yet. Upload a book to get started.
      </div>
    );
  }

  return (
    <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
          <tr>
            <th className="px-5 py-3">Tracking ID</th>
            <th className="px-5 py-3">Books</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Requested On</th>
          </tr>
        </thead>
        <tbody>
          {pickups.map((p) => (
            <tr key={p._id} className="border-t border-mint-line">
              <td className="px-5 py-3 font-mono text-xs text-forest font-semibold">{p.trackingId || p._id.slice(-8)}</td>
              <td className="px-5 py-3">
                {p.books.map((b) => (
                  <div key={b._id} className="mb-2.5 last:mb-0">
                    <span>{b.bookName}</span>
                    <span className="text-muted font-mono text-[11px] block">Payment code: {b.trackingId}</span>
                    <span className="text-xs text-muted block">AI estimate: ₹{b.aiEstimatedPrice || 0}</span>

                    {b.priceApproval === "Pending" && (
                      <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                        <p className="font-semibold text-ink">
                          Admin offered you ₹{b.adminOfferedPrice} instead of the AI's ₹{b.aiEstimatedPrice}
                        </p>
                        {b.adminNote && <p className="text-muted italic mt-0.5">"{b.adminNote}"</p>}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => respond(b._id, "Accept")}
                            disabled={respondingTo === b._id}
                            className="flex items-center gap-1 bg-forest text-white font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            <Check size={12} /> Accept ₹{b.adminOfferedPrice}
                          </button>
                          <button
                            onClick={() => respond(b._id, "Reject")}
                            disabled={respondingTo === b._id}
                            className="flex items-center gap-1 border border-mint-line px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {b.priceApproval === "Accepted" && (
                      <span className="text-[11px] text-forest font-semibold block mt-0.5">
                        You accepted ₹{b.finalPrice}
                      </span>
                    )}

                    {b.priceApproval === "Rejected" && (
                      <span className="text-[11px] text-rose block mt-0.5">
                        You rejected the ₹{b.adminOfferedPrice} offer — waiting for admin's next move
                      </span>
                    )}
                  </div>
                ))}
              </td>
              <td className="px-5 py-3"><StatusPill status={p.status} /></td>
              <td className="px-5 py-3 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Optional — a seller only needs to fill this in if they want the admin to
// pay them online (UPI/bank transfer). If left empty, the admin can still
// mark the pickup as paid via Cash on Delivery when collecting the book.
function BankDetails() {
  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/seller/profile")
      .then((res) => {
        const bd = res.data.seller?.bankDetails;
        if (bd) {
          setForm({
            accountHolderName: bd.accountHolderName || "",
            accountNumber: bd.accountNumber || "",
            ifscCode: bd.ifscCode || "",
            bankName: bd.bankName || "",
            upiId: bd.upiId || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api.patch("/seller/bank-details", form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save bank details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-mint-line rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Landmark size={18} className="text-forest" />
          <h3 className="font-bold text-ink">Bank / UPI Details</h3>
        </div>
        <p className="text-xs text-muted mb-5">
          Optional — only needed if you'd like the admin to pay you online. If you skip this,
          the admin can still pay you in cash (COD) when your book is picked up.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1">UPI ID (easiest)</label>
            <input
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              placeholder="e.g. yourname@upi"
              className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px bg-mint-line flex-1" /> OR bank account <div className="h-px bg-mint-line flex-1" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Account Holder Name</label>
              <input
                value={form.accountHolderName}
                onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Bank Name</label>
              <input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Account Number</label>
              <input
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">IFSC Code</label>
              <input
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          {error && <p className="text-rose text-sm font-medium">{error}</p>}
          {saved && <p className="text-forest text-sm font-medium">Bank details saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-forest text-white font-semibold py-2.5 rounded-lg hover:bg-forest-dark transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Orders customers have placed that include at least one of this seller's
// books — separate from PaymentHistory above, which is about admin payouts
// for pickups, not customer purchases.
function MySales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/seller-orders")
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(err.response?.data?.message || "Failed to load sales"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-mint-line rounded-2xl p-10 text-center text-sm text-muted">
        No sales yet. Orders customers place for your books will show up here.
      </div>
    );
  }

  return (
    <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
          <tr>
            <th className="px-5 py-3">Book</th>
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3">Payment Status</th>
            <th className="px-5 py-3">Order Status</th>
            <th className="px-5 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) =>
            // `books` was populated with a `match` on seller, so it only
            // contains this seller's books from the order — one row per book.
            order.books.map((b) => (
              <tr key={`${order._id}-${b._id}`} className="border-t border-mint-line">
                <td className="px-5 py-3 flex items-center gap-2">
                  {b.images?.[0] && (
                    <img src={b.images[0]} alt={b.bookName} className="w-8 h-8 rounded object-cover border border-mint-line" />
                  )}
                  {b.bookName}
                </td>
                <td className="px-5 py-3">{order.customer?.name || "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === "Paid" ? "bg-forest text-white" : "bg-amber/15 text-amber"}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-5 py-3"><StatusPill status={order.orderStatus} /></td>
                <td className="px-5 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentHistory() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackId, setTrackId] = useState("");
  const [tracked, setTracked] = useState(null);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    api.get("/pickup/my-pickups")
      .then((res) => setPickups(res.data.pickups.filter((p) => p.status === "Paid" || p.status === "Completed")))
      .finally(() => setLoading(false));
  }, []);

  const trackPayment = async (e) => {
    e.preventDefault();
    setTrackError("");
    setTracked(null);
    try {
      const res = await api.get(`/seller/track/${trackId.trim()}`);
      setTracked(res.data.book);
    } catch (err) {
      setTrackError(err.response?.data?.message || "Tracking code not found.");
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={trackPayment} className="bg-white border border-mint-line rounded-2xl p-5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted block mb-1">Track a payment by code (e.g. PMT-K3X9F1)</label>
          <input
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Enter payment tracking code"
            className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <button type="submit" className="bg-forest text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-forest-dark transition">
          Track
        </button>
      </form>
      {trackError && <p className="text-rose text-sm font-medium">{trackError}</p>}
      {tracked && (
        <div className="bg-mint border border-mint-line rounded-2xl p-5 text-sm">
          <p className="font-semibold text-ink">{tracked.bookName}</p>
          <p className="text-muted mt-1">Status: <StatusPill status={tracked.status} /></p>
          <p className="text-muted mt-1">Final price: ₹{tracked.finalPrice ?? "Pending admin approval"}</p>
        </div>
      )}

      {pickups.length === 0 ? (
        <div className="bg-white border border-mint-line rounded-2xl p-10 text-center text-sm text-muted">
          No payments yet. Completed pickups will show up here.
        </div>
      ) : (
        <div className="bg-white border border-mint-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-mint text-left text-xs font-mono text-muted uppercase">
              <tr>
                <th className="px-5 py-3">Books</th>
                <th className="px-5 py-3">Tracking Code</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Paid Via</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p._id} className="border-t border-mint-line">
                  <td className="px-5 py-3">{p.books.map((b) => b.bookName).join(", ")}</td>
                  <td className="px-5 py-3 font-mono text-xs text-forest">
                    {p.books.map((b) => b.trackingId).join(", ")}
                  </td>
                  <td className="px-5 py-3 font-semibold text-forest">
                    ₹{p.books.reduce((sum, b) => sum + (b.finalPrice || 0), 0)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-ink">{p.paymentMode || "—"}</span>
                    {p.paymentMode === "Stripe" && p.stripeReceiptUrl && (
                      <a
                        href={p.stripeReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-forest hover:underline mt-0.5"
                      >
                        View receipt
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}