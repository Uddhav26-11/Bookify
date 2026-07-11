import { Trash2 } from "lucide-react";
import DataTable from "./DataTable";
import StatusPill from "../StatusPill";

const ORDER_STATUS_OPTIONS = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function AdminPayments({ orders, onUpdateStatus, onDelete }) {
  const rows = orders.map((o) => ({
    ...o,
    customerName: o.customer?.name || "—",
    customerEmail: o.customer?.email || "",
    bookNames: o.books.map((b) => b.bookName).join(", "),
  }));

  const columns = [
    { key: "trackingId", label: "Tracking ID", sortable: true, render: (row) => <span className="font-mono text-xs text-forest font-semibold">{row.trackingId}</span> },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.customerName}</p>
          <p className="text-xs text-muted">{row.customerEmail}</p>
        </div>
      ),
    },
    { key: "bookNames", label: "Books", render: (row) => <span className="text-xs">{row.bookNames}</span> },
    { key: "totalAmount", label: "Amount", sortable: true, render: (row) => <span className="font-semibold text-forest">₹{row.totalAmount}</span> },
    { key: "paymentStatus", label: "Payment", render: (row) => <StatusPill status={row.paymentStatus === "Paid" ? "Paid" : "Requested"} /> },
    { key: "orderStatus", label: "Delivery Status", render: (row) => <StatusPill status={row.orderStatus} /> },
    {
      key: "updateStatus",
      label: "Update Delivery Status",
      render: (row) => (
        <select
          value={row.orderStatus}
          onChange={(e) => onUpdateStatus(row._id, e.target.value)}
          className="border border-mint-line rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest"
        >
          {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => onDelete(row)} className="text-rose hover:opacity-70" title="Delete">
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  const totalPaid = orders.filter((o) => o.paymentStatus === "Paid").reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Payments</h1>
      <p className="text-muted text-sm mb-6">
        {orders.length} customer orders · ₹{totalPaid.toLocaleString("en-IN")} collected
      </p>
      <DataTable
        columns={columns}
        data={rows}
        searchKeys={["trackingId", "customerName", "customerEmail"]}
        filterOptions={{
          label: "Delivery Status",
          filterFn: (row) => row.orderStatus,
          options: ORDER_STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
        }}
        emptyText="No orders yet."
      />
    </div>
  );
}
