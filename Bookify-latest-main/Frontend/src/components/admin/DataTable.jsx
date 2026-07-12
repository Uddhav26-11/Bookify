// Frontend/src/components/admin/DataTable.jsx
import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({
  columns,
  data,
  searchKeys = [],
  filterOptions = null,
  pageSize = 8,
  emptyText = "No records found.",
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
      );
    }

    if (filterOptions && filterValue) {
      rows = rows.filter((row) => filterOptions.filterFn(row) === filterValue);
    }

    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return rows;
  }, [data, search, sortKey, sortDir, filterValue, filterOptions, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  return (
    <div className="bg-white border border-mint-line rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-mint-line bg-white">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-mint-line rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        {filterOptions && (
          <select
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setPage(1);
            }}
            className="border border-mint-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
          >
            <option value="">All {filterOptions.label}</option>
            {filterOptions.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-muted font-mono whitespace-nowrap">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Mobile — stacked cards, no horizontal scroll */}
      <div className="sm:hidden divide-y divide-mint-line">
        {pageRows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">{emptyText}</div>
        ) : (
          pageRows.map((row, i) => (
            <div key={row._id || i} className="p-4 space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[11px] text-muted font-mono uppercase shrink-0 pt-0.5">{col.label}</span>
                  <span className="text-right min-w-0">{col.render ? col.render(row) : row[col.key]}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop / tablet — table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-mint text-left text-xs font-mono text-muted uppercase sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-forest transition"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={row._id || i} className="border-t border-mint-line align-middle hover:bg-mint/40 transition">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mint-line text-xs text-muted">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-mint-line disabled:opacity-40 hover:bg-mint transition"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-mint-line disabled:opacity-40 hover:bg-mint transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}