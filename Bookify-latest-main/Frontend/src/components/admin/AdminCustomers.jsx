// Frontend/src/components/admin/AdminCustomers.jsx
import { useState } from "react";
import { UserCircle2, MessageSquare } from "lucide-react";
import DataTable from "./DataTable";
import MessageUserModal from "./MessageUserModal";

export default function AdminCustomers({ users, orders }) {
  const [messageTarget, setMessageTarget] = useState(null);
  const customers = users
    .filter((u) => u.role === "customer")
    .map((u) => ({
      ...u,
      orderCount: orders.filter((o) => o.customer?._id === u._id).length,
    }));

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-mint flex items-center justify-center text-forest shrink-0">
            <UserCircle2 size={20} />
          </div>
          <span className="font-medium text-ink">{row.name}</span>
        </div>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "orderCount", label: "Orders", sortable: true },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row) => <span className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      key: "orderCount2",
      label: "Status",
      render: (row) => (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            row.orderCount > 0 ? "bg-forest/10 text-forest" : "bg-mint text-muted"
          }`}
        >
          {row.orderCount > 0 ? "Active Buyer" : "No Orders Yet"}
        </span>
      ),
    },
    {
      key: "message",
      label: "",
      render: (row) => (
        <button
          onClick={() => setMessageTarget(row)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-mint text-forest hover:bg-forest hover:text-white transition"
        >
          <MessageSquare size={13} />
          Message
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Customers</h1>
      <p className="text-muted text-sm mb-6">{customers.length} registered customers on the platform.</p>
      <DataTable
        columns={columns}
        data={customers}
        searchKeys={["name", "email", "phone"]}
        emptyText="No customers yet."
      />

      {messageTarget && (
        <MessageUserModal user={messageTarget} onClose={() => setMessageTarget(null)} />
      )}
    </div>
  );
}