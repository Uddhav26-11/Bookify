import { useMemo, useState } from "react";
import { Trash2, BookOpen } from "lucide-react";
import DataTable from "./DataTable";
import StatusPill from "../StatusPill";
import SortDropdown from "../SortDropdown";
import Lightbox from "../Lightbox";
import { sortBooks, isBookSold } from "../../utils/sortBooks";

const STATUS_OPTIONS = ["Requested", "Assigned", "UnderVerification", "Approved", "Collected", "Paid", "Completed", "Rejected"];

export default function AdminBooks({ books, onUpdatePrice, onDeleteBook }) {
  const [tab, setTab] = useState("unsold"); // "unsold" | "sold"
  const [sort, setSort] = useState("");
  const [lightbox, setLightbox] = useState(null); // { images, startIndex, title }

  const soldCount = books.filter((b) => isBookSold(b)).length;
  const unsoldCount = books.length - soldCount;

  const tabFiltered = useMemo(
    () => books.filter((b) => (tab === "sold" ? isBookSold(b) : !isBookSold(b))),
    [books, tab]
  );

  const displayed = useMemo(() => (sort ? sortBooks(tabFiltered, sort) : tabFiltered), [tabFiltered, sort]);

  const columns = [
    {
      key: "bookName",
      label: "Book",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (row.images?.length) {
                setLightbox({ images: row.images, startIndex: 0, title: row.bookName });
              }
            }}
            className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center text-forest shrink-0 overflow-hidden hover:ring-2 hover:ring-forest transition"
            title={row.images?.length ? "View photos" : undefined}
          >
            {row.images?.[0] ? (
              <img src={row.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <BookOpen size={16} />
            )}
          </button>
          <div>
            <p className="font-medium text-ink">{row.bookName}</p>
            <p className="text-[11px] text-muted font-mono">{row.trackingId}</p>
          </div>
        </div>
      ),
    },
    { key: "sellerName", label: "Seller", sortable: true },
    { key: "subject", label: "Category", render: (row) => row.subject || row.class || "—" },
    { key: "condition", label: "Condition" },
    {
      key: "finalPrice",
      label: "Price",
      sortable: true,
      render: (row) => (
        <input
          type="number"
          defaultValue={row.finalPrice || row.aiEstimatedPrice || 0}
          onBlur={(e) => onUpdatePrice(row._id, e.target.value)}
          className="w-24 border border-mint-line rounded-lg px-2 py-1 text-sm font-semibold text-forest focus:outline-none focus:ring-2 focus:ring-forest"
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "sold",
      label: "Sold?",
      render: (row) =>
        isBookSold(row) ? (
          <span className="text-xs font-semibold text-forest">✅ Sold</span>
        ) : (
          <span className="text-xs font-semibold text-muted">📚 Unsold</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button onClick={() => onDeleteBook(row._id)} className="text-rose hover:opacity-70" title="Delete">
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Books</h1>
      <p className="text-muted text-sm mb-5">{books.length} books across all pickup requests.</p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="inline-flex bg-mint border border-mint-line rounded-xl p-1">
          <button
            onClick={() => setTab("unsold")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              tab === "unsold" ? "bg-white text-forest shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            📚 Unsold ({unsoldCount})
          </button>
          <button
            onClick={() => setTab("sold")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              tab === "sold" ? "bg-white text-forest shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            ✅ Sold ({soldCount})
          </button>
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      <DataTable
        columns={columns}
        data={displayed}
        searchKeys={["bookName", "sellerName", "trackingId"]}
        filterOptions={{
          label: "Status",
          filterFn: (row) => row.status,
          options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
        }}
        emptyText={tab === "sold" ? "No sold books yet." : "No unsold books yet."}
      />

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
