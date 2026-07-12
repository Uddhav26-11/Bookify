import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Upload, Sparkles, Check, X, Plus, Trash2, Landmark, CheckCircle, IndianRupee,
  BookOpen, Clock, ChevronDown, GraduationCap, School, Award, Library, Search,
} from "lucide-react";
import StatusPill from "../components/StatusPill";
import { getAIEstimate } from "../data/aiPricing";
import api from "../api/axios";

const TABS = ["Upload Book", "Track Requests", "Payment History", "Bank Details"];

/* ------------------------------------------------------------------ */
/* Shared option lists for the category-driven upload flow            */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  { id: "school", label: "School Books", icon: School },
  { id: "college", label: "College Books", icon: GraduationCap },
  { id: "competitive", label: "Competitive Exam Books", icon: Award },
  { id: "other", label: "Other Books", icon: Library },
];

const BOARD_OPTIONS = ["CBSE", "ICSE", "State Board", "Other"];
const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SCHOOL_SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Physics", "Chemistry", "Biology", "Computer Science", "Sanskrit", "Other"];

const STREAM_OPTIONS = ["Science", "Commerce", "Arts"];

// Subjects genuinely differ by class stage (primary vs middle vs senior
// secondary streams) — so the Subject dropdown adapts to whatever Class
// (and, for 11th/12th, Stream) was picked instead of always showing the
// same long generic list. Every list ends with "Other" as an escape hatch.
function getSchoolSubjects(cls, stream) {
  const n = Number(cls);
  if (!n) return SCHOOL_SUBJECTS;
  if (n <= 2) return ["Mathematics", "English", "Hindi", "Environmental Studies (EVS)", "Art & Craft", "Other"];
  if (n <= 5) return ["Mathematics", "English", "Hindi", "Environmental Studies (EVS)", "Science", "Social Studies", "Computer", "Other"];
  if (n <= 8) return ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer", "Sanskrit", "Other"];
  if (n <= 10) return ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer Science", "Sanskrit", "Other"];

  // 11th & 12th — subjects depend on the stream
  if (stream === "Science") return ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Physical Education", "Other"];
  if (stream === "Commerce") return ["Accountancy", "Business Studies", "Economics", "Mathematics", "English", "Computer Science", "Other"];
  if (stream === "Arts") return ["History", "Geography", "Political Science", "Psychology", "Economics", "Sociology", "English", "Other"];
  return [];
}

const COURSE_OPTIONS = ["B.Tech", "BCA", "BBA", "B.Com", "B.Sc", "B.A.", "MBA", "M.Tech", "M.Sc", "M.Com", "Other"];
const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];
const SEMESTER_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const COLLEGE_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Data Structures", "Programming", "Economics", "Accountancy", "Marketing", "English", "Electronics", "Mechanics", "Other"];

const EXAM_TYPES = ["UPSC", "SSC", "JEE", "NEET", "GATE", "CAT", "Banking", "Railway", "NDA", "CUET", "Other"];

const OTHER_CATEGORIES = ["Fiction", "Non-fiction", "Self-help", "Children's Books", "Comics", "Biography", "Other"];

function emptyCategoryForm() {
  return {
    category: "",
    board: "", cls: "", stream: "", subject: "", subjectCustom: "",
    course: "", courseCustom: "", year: "", semester: "", collegeSubject: "", collegeSubjectCustom: "",
    examType: "", examTypeCustom: "",
    otherCategory: "", otherCategoryCustom: "",
    bookName: "", author: "", publication: "", condition: "Good",
  };
}

// Resolves the category-specific selections down to the backend's flat
// board / class / subject fields, without touching any backend code.
function resolveCategoryFields(f) {
  if (f.category === "school") {
    const needsStream = Number(f.cls) >= 11;
    const cls = needsStream && f.stream ? `${f.cls} (${f.stream})` : f.cls;
    return { board: f.board, cls, subject: f.subject === "Other" ? f.subjectCustom : f.subject };
  }
  if (f.category === "college") {
    const course = f.course === "Other" ? f.courseCustom : f.course;
    const subject = f.collegeSubject === "Other" ? f.collegeSubjectCustom : f.collegeSubject;
    return { board: "College", cls: `${course}${f.year ? ` • Year ${f.year}` : ""}${f.semester ? ` • Sem ${f.semester}` : ""}`, subject };
  }
  if (f.category === "competitive") {
    const exam = f.examType === "Other" ? f.examTypeCustom : f.examType;
    return { board: "Competitive Exam", cls: exam, subject: "" };
  }
  if (f.category === "other") {
    const cat = f.otherCategory === "Other" ? f.otherCategoryCustom : f.otherCategory;
    return { board: "Other", cls: cat, subject: "" };
  }
  return { board: "", cls: "", subject: "" };
}

function categoryComplete(f) {
  if (!f.category) return false;
  if (f.category === "school") {
    const needsStream = Number(f.cls) >= 11;
    return !!(f.board && f.cls && (!needsStream || f.stream) && f.subject && (f.subject !== "Other" || f.subjectCustom));
  }
  if (f.category === "college") return !!(f.course && (f.course !== "Other" || f.courseCustom) && f.year && f.semester && f.collegeSubject && (f.collegeSubject !== "Other" || f.collegeSubjectCustom));
  if (f.category === "competitive") return !!(f.examType && (f.examType !== "Other" || f.examTypeCustom));
  if (f.category === "other") return !!(f.otherCategory && (f.otherCategory !== "Other" || f.otherCategoryCustom));
  return false;
}

/* ------------------------------------------------------------------ */
/* Category card selector — replaces free-text category entry          */
/* ------------------------------------------------------------------ */
function CategorySelector({ value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted block mb-2">Select Book Category</label>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition min-h-[96px] ${
                active
                  ? "border-forest bg-mint shadow-sm"
                  : "border-mint-line bg-white hover:border-forest/40 hover:bg-mint/40"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "btn-brand text-white" : "bg-mint text-forest"}`}>
                <c.icon size={18} />
              </div>
              <span className={`text-xs font-semibold leading-tight ${active ? "text-forest" : "text-ink"}`}>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable expandable dropdown ("beautiful accordion" selector)       */
/* ------------------------------------------------------------------ */
function SelectField({ label, value, onChange, options, placeholder = "Select an option", searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const filtered = searchable && query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs font-medium text-muted block mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm text-left bg-white transition ${
          open ? "border-forest ring-2 ring-forest/15 shadow-sm" : "border-mint-line hover:border-forest/40"
        }`}
      >
        <span className={value ? "text-ink font-medium" : "text-muted"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-forest" : ""}`} />
      </button>

      {open && (
        <>
          {/* Backdrop just for mobile to make the floating panel feel intentional; transparent, click-through-safe via ref check above */}
          <div
            className="absolute z-30 left-0 right-0 top-[calc(100%+6px)] origin-top rounded-2xl border border-mint-line bg-white shadow-[0_12px_32px_-8px_rgba(20,36,32,0.18)] overflow-hidden animate-[popIn_0.16s_ease-out]"
          >
            {searchable && (
              <div className="p-2.5 border-b border-mint-line flex items-center gap-2 bg-mint/40">
                <Search size={14} className="text-muted ml-1 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-1.5 py-1.5 text-sm bg-transparent focus:outline-none placeholder:text-muted"
                />
              </div>
            )}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 && <p className="px-4 py-3 text-sm text-muted">No matches found</p>}
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2.5 text-sm transition hover:bg-mint ${
                    value === opt ? "text-forest font-semibold" : "text-ink"
                  }`}
                >
                  {opt}
                  {value === opt && <Check size={14} className="text-forest shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// The full block of category-dependent dropdowns (Board/Class/Subject,
// Course/Year/Semester/Subject, Exam Type, or Other Category) followed by
// Book Name / Author / Publication. Shared by the single and bulk forms.
function CategoryFormFields({ f, set }) {
  return (
    <div className="space-y-4">
      <CategorySelector value={f.category} onChange={(v) => set({ category: v })} />

      {f.category === "school" && (
        <div className="grid sm:grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease-out]">
          <SelectField label="Board" value={f.board} onChange={(v) => set({ board: v })} options={BOARD_OPTIONS} placeholder="Select board" />
          <SelectField label="Class" value={f.cls} onChange={(v) => set({ cls: v, stream: "", subject: "", subjectCustom: "" })} options={CLASS_OPTIONS} placeholder="Select class" searchable />

          {Number(f.cls) >= 11 && (
            <div className="sm:col-span-2">
              <SelectField label="Stream" value={f.stream} onChange={(v) => set({ stream: v, subject: "", subjectCustom: "" })} options={STREAM_OPTIONS} placeholder="Select stream" />
            </div>
          )}

          <div className="sm:col-span-2">
            {(() => {
              const needsStream = Number(f.cls) >= 11;
              const ready = f.cls && (!needsStream || f.stream);
              return ready ? (
                <SelectField label="Subject" value={f.subject} onChange={(v) => set({ subject: v, subjectCustom: v === "Other" ? f.subjectCustom : "" })} options={getSchoolSubjects(f.cls, f.stream)} placeholder="Select subject" searchable />
              ) : (
                <div>
                  <label className="text-xs font-medium text-muted block mb-1">Subject</label>
                  <div className="w-full rounded-xl border border-dashed border-mint-line px-4 py-2.5 text-sm text-muted bg-mint/30">
                    {needsStream && f.cls ? "Select a stream first" : "Select a class first"}
                  </div>
                </div>
              );
            })()}
          </div>
          {f.subject === "Other" && <div className="sm:col-span-2"><Field label="Specify Subject" value={f.subjectCustom} onChange={(v) => set({ subjectCustom: v })} /></div>}
        </div>
      )}

      {f.category === "college" && (
        <div className="grid sm:grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="sm:col-span-2">
            <SelectField label="Course" value={f.course} onChange={(v) => set({ course: v, courseCustom: v === "Other" ? f.courseCustom : "" })} options={COURSE_OPTIONS} placeholder="Select course" searchable />
          </div>
          {f.course === "Other" && <div className="sm:col-span-2"><Field label="Specify Course" value={f.courseCustom} onChange={(v) => set({ courseCustom: v })} /></div>}
          <SelectField label="Year" value={f.year} onChange={(v) => set({ year: v })} options={YEAR_OPTIONS} placeholder="Select year" />
          <SelectField label="Semester" value={f.semester} onChange={(v) => set({ semester: v })} options={SEMESTER_OPTIONS} placeholder="Select semester" searchable />
          <div className="sm:col-span-2">
            <SelectField label="Subject" value={f.collegeSubject} onChange={(v) => set({ collegeSubject: v, collegeSubjectCustom: v === "Other" ? f.collegeSubjectCustom : "" })} options={COLLEGE_SUBJECTS} placeholder="Select subject" searchable />
          </div>
          {f.collegeSubject === "Other" && <div className="sm:col-span-2"><Field label="Specify Subject" value={f.collegeSubjectCustom} onChange={(v) => set({ collegeSubjectCustom: v })} /></div>}
        </div>
      )}

      {f.category === "competitive" && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <SelectField label="Exam Type" value={f.examType} onChange={(v) => set({ examType: v, examTypeCustom: v === "Other" ? f.examTypeCustom : "" })} options={EXAM_TYPES} placeholder="Select exam type" searchable />
          {f.examType === "Other" && <Field label="Specify Exam" value={f.examTypeCustom} onChange={(v) => set({ examTypeCustom: v })} />}
        </div>
      )}

      {f.category === "other" && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <SelectField label="Category" value={f.otherCategory} onChange={(v) => set({ otherCategory: v, otherCategoryCustom: v === "Other" ? f.otherCategoryCustom : "" })} options={OTHER_CATEGORIES} placeholder="Select category" searchable />
          {f.otherCategory === "Other" && <Field label="Specify Category" value={f.otherCategoryCustom} onChange={(v) => set({ otherCategoryCustom: v })} />}
        </div>
      )}

      {f.category && categoryComplete(f) && (
        <div className="grid sm:grid-cols-2 gap-4 pt-1 animate-[fadeIn_0.2s_ease-out] border-t border-mint-line mt-1">
          <div className="sm:col-span-2 pt-3">
            <Field label="Book Name" value={f.bookName} onChange={(v) => set({ bookName: v })} />
          </div>
          <Field label="Author" value={f.author} onChange={(v) => set({ author: v })} />
          <Field label="Publication" value={f.publication} onChange={(v) => set({ publication: v })} />
        </div>
      )}
    </div>
  );
}

const STAT_CARDS = [
  { label: "Total Books", key: "totalBooks", icon: BookOpen },
  { label: "Pending Books", key: "pendingBooks", icon: Clock },
  { label: "Approved Books", key: "approvedBooks", icon: CheckCircle },
  { label: "Sold Books", key: "soldBooks", icon: BookOpen },
  { label: "Earnings", key: "earnings", icon: IndianRupee, isCurrency: true },
];

// Live seller stats (Books Paid, Amount Received, Books Accepted, Pending
// Payments) pulled fresh from GET /api/seller/dashboard every time this
// mounts — i.e. on every page load/refresh — so the numbers always reflect
// the database and never get stuck at a stale/zero value from a previous
// render.
//
// IMPORTANT: this is strictly the seller's sell-to-platform payout status
// (pickup request -> admin approval -> admin pays seller). It has nothing
// to do with whether a customer later buys the book from Bookify — sellers
// never see customer purchase activity, so there is no live event to
// subscribe to here; a fresh fetch on mount is enough.
function SellerStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/seller/dashboard")
      .then((res) => setStats(res.data.stats))
      .catch(() => setStats((prev) => prev || { completedOrders: 0, revenue: 0, booksSold: 0, pendingOrders: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-mint-line rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <h2 className="font-bold text-sm sm:text-base text-ink mb-3 sm:mb-4">Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {STAT_CARDS.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-2.5 sm:gap-3 rounded-xl bg-mint/60 border border-mint-line px-3 py-2.5 sm:px-4 sm:py-3 min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white flex items-center justify-center text-forest shrink-0">
              <c.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted font-mono truncate">{c.label}</p>
              <p className="text-sm sm:text-xl font-bold text-ink truncate">
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
    </div>
  );
}

export default function SellerDashboard() {
  const [tab, setTab] = useState("Upload Book");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink">Seller Dashboard</h1>
      <p className="text-muted text-sm mt-1">Upload books, track pickup requests, and view your payments.</p>

      <div className="mt-6">
        <SellerStats />
      </div>

      <div className="flex gap-1 sm:gap-2 mt-2 border-b border-mint-line overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap shrink-0 ${
              tab === t ? "border-forest text-forest" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 sm:mt-8">
        {tab === "Upload Book" && <UploadBook />}
        {tab === "Track Requests" && <TrackRequests />}
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
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            mode === "single" ? "btn-brand text-white" : "bg-white border border-mint-line text-ink"
          }`}
        >
          Single Book
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            mode === "bulk" ? "btn-brand text-white" : "bg-white border border-mint-line text-ink"
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
  const [cat, setCat] = useState(emptyCategoryForm());
  const setCatFields = (patch) => setCat((prev) => ({ ...prev, ...patch }));
  const [sellerPrice, setSellerPrice] = useState("");
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

    if (!categoryComplete(cat)) {
      setError("Please complete the category details above.");
      return;
    }
    if (!cat.bookName) {
      setError("Please enter the book name.");
      return;
    }
    if (files.length !== 4) {
      setError("Please upload exactly 4 photos (cover, back, spine, and any damage).");
      return;
    }

    setLoading(true);
    setEstimate(null);
    setDecision(null);
    try {
      const resolved = resolveCategoryFields(cat);
      const form = { name: cat.bookName, cls: resolved.cls, board: resolved.board, subject: resolved.subject, author: cat.author, publication: cat.publication, condition: cat.condition };
      const result = await getAIEstimate({ form, files, sellerPrice });
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
      const resolved = resolveCategoryFields(cat);
      const fd = new FormData();
      fd.append("bookName", cat.bookName);
      fd.append("class", resolved.cls);
      fd.append("board", resolved.board);
      fd.append("subject", resolved.subject);
      fd.append("author", cat.author);
      fd.append("publication", cat.publication);
      fd.append("condition", cat.condition);
      fd.append("aiEstimatedPrice", estimate.priceEstimate);
      fd.append("confidenceScore", estimate.confidence);
      if (sellerPrice) fd.append("sellerProposedPrice", sellerPrice);
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
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
      <form onSubmit={submit} className="bg-white border border-mint-line rounded-2xl p-4 sm:p-6 space-y-5">
        <CategoryFormFields f={cat} set={setCatFields} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Condition</label>
            <select
              value={cat.condition}
              onChange={(e) => setCatFields({ condition: e.target.value })}
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
              value={sellerPrice}
              onChange={(e) => setSellerPrice(e.target.value)}
              className="w-full border border-mint-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Photos — exactly 4 required</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-mint-line rounded-xl py-8 cursor-pointer hover:bg-mint transition active:scale-[0.99]">
            <Upload size={20} className="text-forest" />
            <span className="text-sm text-muted text-center px-4">Upload cover, back, spine, and any damage (4 photos, one at a time or together)</span>
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
          className="w-full btn-brand text-white font-semibold py-3 sm:py-2.5 rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2 sticky bottom-3 sm:static shadow-lg sm:shadow-none"
        >
          <Sparkles size={16} /> {loading ? "Analyzing photos..." : "Get AI Price Estimate"}
        </button>
      </form>

      <div className="bg-mint border border-mint-line rounded-2xl p-4 sm:p-5 flex flex-col">
        <h3 className="font-bold text-sm sm:text-base text-ink mb-3">AI Pricing Result</h3>
        {!estimate && !loading && (
          <p className="text-xs sm:text-sm text-muted flex-1 flex items-center justify-center text-center py-6">
            Upload photos and submit the form to see your instant estimate here.
          </p>
        )}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted text-xs sm:text-sm py-6">
            <div className="w-8 h-8 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
            Scanning cover condition, corners, and binding...
          </div>
        )}
        {estimate && !loading && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-[11px] font-mono text-muted">Estimated Selling Price</p>
              <p className="text-3xl font-bold text-ink">₹{estimate.priceEstimate}</p>
              <p className="text-xs text-muted mt-0.5">Confidence: {estimate.confidence}%</p>
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
                  className="flex-1 btn-brand text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
  const emptyBook = () => ({ ...emptyCategoryForm(), files: [], previews: [] });
  const [books, setBooks] = useState([emptyBook()]);
  const [openIndex, setOpenIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const updateBook = (index, key, value) => {
    setBooks((prev) => prev.map((b, i) => (i === index ? { ...b, [key]: value } : b)));
  };

  const patchBook = (index, patch) => {
    setBooks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
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

  const addBook = () => setBooks((prev) => { setOpenIndex(prev.length); return [...prev, emptyBook()]; });
  const removeBook = (index) => setBooks((prev) => prev.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const incompleteIdx = books.findIndex((b) => !categoryComplete(b) || !b.bookName);
    if (incompleteIdx !== -1) {
      setError(`Book ${incompleteIdx + 1} needs its category details and book name filled in.`);
      setOpenIndex(incompleteIdx);
      return;
    }

    const badBook = books.findIndex((b) => b.files.length !== 4);
    if (badBook !== -1) {
      setError(`Book ${badBook + 1} needs exactly 4 photos (currently ${books[badBook].files.length}).`);
      setOpenIndex(badBook);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      const metadata = books.map((b) => {
        const resolved = resolveCategoryFields(b);
        return { bookName: b.bookName, class: resolved.cls, board: resolved.board, subject: resolved.subject, author: b.author, publication: b.publication, condition: b.condition };
      });
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
    <form onSubmit={submit} className="space-y-4 sm:space-y-6">
      {books.map((b, i) => {
        const open = openIndex === i;
        const complete = categoryComplete(b) && !!b.bookName && b.files.length === 4;
        return (
          <div key={i} className="bg-white border border-mint-line rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : i)}
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${complete ? "btn-brand text-white" : "bg-mint text-forest"}`}>
                  {complete ? <Check size={13} /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-muted uppercase">Book {i + 1}</p>
                  <p className="text-sm font-semibold text-ink truncate">{b.bookName || "Untitled book"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {books.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeBook(i); }}
                    className="text-rose hover:opacity-70 p-1"
                  >
                    <Trash2 size={16} />
                  </span>
                )}
                <ChevronDown size={18} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </button>

            <div className={`grid transition-all duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className={open ? "overflow-visible" : "overflow-hidden"}>
                <div className="px-4 sm:px-6 pb-6 space-y-5 border-t border-mint-line pt-5">
                  <CategoryFormFields f={b} set={(patch) => patchBook(i, patch)} />

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
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-mint-line rounded-xl py-6 cursor-pointer hover:bg-mint transition">
                      <Upload size={18} className="text-forest" />
                      <span className="text-xs text-muted text-center px-4">Tap to upload cover, back, spine, and any damage</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => onFile(i, e)} className="hidden" />
                    </label>
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
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addBook}
        className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-forest border border-mint-line rounded-lg px-4 py-2.5 hover:bg-mint transition"
      >
        <Plus size={16} /> Add Another Book
      </button>

      {error && <p className="text-rose text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full btn-brand text-white font-semibold py-3 sm:py-2.5 rounded-lg transition disabled:opacity-50 sticky bottom-3 sm:static shadow-lg sm:shadow-none"
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

  const BooksCell = ({ books }) => (
    <>
      {books.map((b) => (
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
                  className="flex items-center gap-1 btn-brand text-white font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
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
    </>
  );

  return (
    <div>
      {/* Mobile / small screens — responsive cards, no horizontal scroll */}
      <div className="sm:hidden space-y-3">
        {pickups.map((p) => (
          <div key={p._id} className="bg-white border border-mint-line rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-xs text-forest font-semibold">{p.trackingId || p._id.slice(-8)}</span>
              <StatusPill status={p.status} />
            </div>
            <div className="text-sm">
              <BooksCell books={p.books} />
            </div>
            <p className="text-[11px] text-muted mt-2 pt-2 border-t border-mint-line">
              Requested on {new Date(p.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop / tablet — table */}
      <div className="hidden sm:block bg-white border border-mint-line rounded-2xl overflow-x-auto">
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
                  <BooksCell books={p.books} />
                </td>
                <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                <td className="px-5 py-3 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
            className="w-full btn-brand text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </form>
      </div>
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
        <button type="submit" className="btn-brand text-white font-semibold px-5 py-2.5 rounded-lg transition">
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
        <>
          {/* Mobile — cards, no horizontal scroll */}
          <div className="sm:hidden space-y-3">
            {pickups.map((p) => (
              <div key={p._id} className="bg-white border border-mint-line rounded-2xl p-4 shadow-sm text-sm">
                <p className="font-semibold text-ink">{p.books.map((b) => b.bookName).join(", ")}</p>
                <p className="font-mono text-[11px] text-forest mt-0.5">
                  {p.books.map((b) => b.trackingId).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-forest">₹{p.books.reduce((sum, b) => sum + (b.finalPrice || 0), 0)}</span>
                  <span className="text-xs text-ink">{p.paymentMode || "—"}</span>
                </div>
                {p.paymentMode === "Stripe" && p.stripeReceiptUrl && (
                  <a
                    href={p.stripeReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-forest hover:underline mt-1"
                  >
                    View receipt
                  </a>
                )}
                <p className="text-[11px] text-muted mt-2 pt-2 border-t border-mint-line">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop — table */}
          <div className="hidden sm:block bg-white border border-mint-line rounded-2xl overflow-x-auto">
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
        </>
      )}
    </div>
  );
}