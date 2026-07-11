// Frontend/src/components/admin/AdminSellers.jsx
import { UserCircle2 } from "lucide-react";
import DataTable from "./DataTable";

export default function AdminSellers({ users, books }) {
  const sellers = users
    .filter((u) => u.role === "seller")
    .map((u) => ({
      ...u,
      totalBooks: books.filter((b) => b.sellerId === u._id).length,
      addressLine: [u.address, u.city, u.pincode].filter(Boolean).join(", "),
      status: u.bankDetails?.isAdded ? "Bank Added" : "No Bank Details",
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
    {
      key: "addressLine",
      label: "Address",
      render: (row) => <span className="text-xs text-muted">{row.addressLine || "—"}</span>,
    },
    { key: "totalBooks", label: "Total Books", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            row.status === "Bank Added" ? "bg-forest/10 text-forest" : "bg-amber/15 text-amber"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => <span className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString("en-IN")}</span>,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">Sellers</h1>
      <p className="text-muted text-sm mb-6">{sellers.length} registered sellers on the platform.</p>
      <DataTable
        columns={columns}
        data={sellers}
        searchKeys={["name", "email", "phone"]}
        filterOptions={{
          label: "Status",
          filterFn: (row) => row.status,
          options: [
            { value: "Bank Added", label: "Bank Added" },
            { value: "No Bank Details", label: "No Bank Details" },
          ],
        }}
        emptyText="No sellers yet."
      />
    </div>
  );
}