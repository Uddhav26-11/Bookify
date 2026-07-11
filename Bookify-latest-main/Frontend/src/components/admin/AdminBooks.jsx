import { Trash2, BookOpen } from "lucide-react";
import DataTable from "./DataTable";
import StatusPill from "../StatusPill";

const STATUS_OPTIONS = ["Requested", "Assigned", "UnderVerification", "Approved", "Collected", "Paid", "Completed", "Rejected"];

export default function AdminBooks({ books, onUpdatePrice, onDeleteBook }) {
  const columns = [
    {
      key: "bookName",
      label: "Book",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center text-forest shrink-0 overflow-hidden">
            {row.images?.[0] ? (
              <img src={row.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={16} />
            )}
          </div>
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
      <p className="text-muted text-sm mb-6">{books.length} books across all pickup requests.</p>
      <DataTable
        columns={columns}
        data={books}
        searchKeys={["bookName", "sellerName", "trackingId"]}
        filterOptions={{
          label: "Status",
          filterFn: (row) => row.status,
          options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
        }}
        emptyText="No books yet."
      />
    </div>
  );
}
