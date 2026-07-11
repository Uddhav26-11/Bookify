// Frontend/src/components/admin/AdminOverview.jsx
import {
  Users,
  UserCheck,
  BookOpen,
  Clock,
  CheckCircle,
  IndianRupee,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import StatCard from "./StatCard";

const CHART_GREEN = "#14713F";
const CHART_GREEN_LIGHT = "#C9F26C";

export default function AdminOverview({ stats, analytics, pickups, users = [], onNavigate }) {
  const totalSellers = stats.totalSellers || 0;
  const totalCustomers = stats.totalCustomers || 0;
  const booksUploaded = stats.booksUploaded || 0;
  const pendingRequests = stats.pendingRequests || 0;

  const sellerGrowth = groupByMonth(users.filter((u) => u.role === "seller").map((u) => u.createdAt));
  const customerGrowth = groupByMonth(users.filter((u) => u.role === "customer").map((u) => u.createdAt));
  const bookCategoryData = groupBy(
    pickups.flatMap((p) => p.books || []),
    (b) => b.subject || b.class || "Other"
  );
  const requestStatusData = groupBy(pickups, (p) => p.status);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-bold text-lg text-ink mb-3">Platform Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={UserCheck} label="Total Sellers" value={totalSellers} onClick={() => onNavigate("sellers")} />
          <StatCard icon={Users} label="Total Customers" value={totalCustomers} onClick={() => onNavigate("customers")} />
          <StatCard icon={Clock} label="Total Pickup Requests" value={pickups.length} onClick={() => onNavigate("pickups")} />
          <StatCard icon={BookOpen} label="Total Books" value={booksUploaded} onClick={() => onNavigate("books")} />
          <StatCard icon={IndianRupee} label="Total Revenue" value={stats.revenue} isCurrency onClick={() => onNavigate("payments")} />
          <StatCard icon={CheckCircle} label="Completed Orders" value={stats.completedOrders} onClick={() => onNavigate("payments")} />
          <StatCard icon={Clock} label="Pending Requests" value={pendingRequests} onClick={() => onNavigate("pickups")} />
          <StatCard icon={Wallet} label="Avg. Book Purchase Price" value={analytics?.avgSellingPrice} isCurrency growth={analytics?.momChange} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-lg text-ink mb-3">Seller Growth</h2>
          <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
            {sellerGrowth.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sellerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#667C72" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                  <Bar dataKey="value" name="New Sellers" fill={CHART_GREEN} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg text-ink mb-3">Customer Growth</h2>
          <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
            {customerGrowth.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#667C72" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                  <Bar dataKey="value" name="New Customers" fill="#0E5730" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-lg text-ink mb-3">📈 Book Sales Trend</h2>
        <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
          {analytics?.salesTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#667C72" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                <Line type="monotone" dataKey="booksSold" name="Books Sold" stroke={CHART_GREEN} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-lg text-ink mb-3">💰 Average Selling Price Trend</h2>
          <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
            {analytics?.avgPriceTrend?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analytics.avgPriceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#667C72" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#667C72" }} />
                  <Tooltip formatter={(v) => `₹${v}`} contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                  <Line type="monotone" dataKey="avgPrice" name="Avg Price (₹)" stroke="#0E5730" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg text-ink mb-3">Pickup Request Status</h2>
          <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
            {requestStatusData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={requestStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#667C72" }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                  <Bar dataKey="value" name="Requests" fill={CHART_GREEN} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-lg text-ink mb-3">Books Listed by Category</h2>
        <div className="bg-white border border-mint-line rounded-2xl p-5 shadow-sm">
          {bookCategoryData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#667C72" }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D3EEDC" }} />
                <Bar dataKey="value" name="Books" fill={CHART_GREEN_LIGHT} stroke={CHART_GREEN} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      <div>
        <h2 className="font-bold text-lg text-ink mb-3">Analytics Summary</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={BookOpen} label="Total Books Sold" value={analytics?.totalBooksSold} />
          <StatCard icon={IndianRupee} label="Total Revenue" value={analytics?.totalRevenue} isCurrency />
          <StatCard icon={Wallet} label="Average Selling Price" value={analytics?.avgSellingPrice} isCurrency />
          <StatCard icon={ShoppingBag} label="Pending Pickup Requests" value={analytics?.pendingPickupRequests} />
          <StatCard icon={UserCheck} label="Active Sellers" value={analytics?.activeSellers} />
          <StatCard icon={Users} label="Active Customers" value={analytics?.activeCustomers} />
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-52 flex items-center justify-center text-sm text-muted">
      No Data Available
    </div>
  );
}

function groupBy(items, keyFn) {
  const map = {};
  for (const item of items) {
    const key = keyFn(item) || "Other";
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function groupByMonth(dates) {
  const map = {};
  for (const d of dates) {
    const date = new Date(d);
    const key = date.toLocaleString("en-IN", { month: "short", year: "numeric" });
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}