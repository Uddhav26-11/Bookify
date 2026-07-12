// Frontend/src/components/admin/AdminOverview.jsx
import {
  Users,
  UserCheck,
  BookOpen,
  Clock,
  CheckCircle,
  IndianRupee,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import StatCard from "./StatCard";

// Bookify premium gradient scale
const GRAD_FROM = "#16A34A";
const GRAD_MID = "#22C55E";
const GRAD_TO = "#4ADE80";

export default function AdminOverview({ stats, analytics, pickups, users = [], onNavigate }) {
  const totalSellers = stats.totalSellers || 0;
  const totalCustomers = stats.totalCustomers || 0;
  const booksUploaded = stats.booksUploaded || 0;
  const pendingRequests = stats.pendingRequests || 0;

  // ---- Graph 1: Seller Book Listing Analytics (real data from pickups) ----
  const sellerData = buildSellerListingData(pickups);

  // ---- Graph 2: Books Sold Analytics (real data from completed orders) ----
  const salesData = buildBooksSoldData(analytics);

  // ---- Graph 3: Average Profit (customer price - admin purchase price) ----
  const profitData = analytics?.profitTrend || [];

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
          <StatCard icon={Wallet} label="Purchase Cost" value={stats.purchaseCost ?? analytics?.purchaseCost} isCurrency onClick={() => onNavigate("payments")} />
          <StatCard icon={TrendingUp} label="Total Profit" value={stats.totalProfit ?? analytics?.totalProfit} isCurrency onClick={() => onNavigate("payments")} />
          <StatCard icon={TrendingUp} label="Average Profit" value={stats.avgProfit ?? analytics?.avgProfit} isCurrency />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Seller Book Listing Analytics" subtitle="Books listed per seller · real database data">
          {sellerData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="sellerBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRAD_TO} />
                    <stop offset="55%" stopColor={GRAD_MID} />
                    <stop offset="100%" stopColor={GRAD_FROM} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#667C72" }}
                  interval={0}
                  angle={sellerData.length > 5 ? -20 : 0}
                  textAnchor={sellerData.length > 5 ? "end" : "middle"}
                  height={sellerData.length > 5 ? 50 : 30}
                  axisLine={{ stroke: "#D3EEDC" }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} axisLine={false} tickLine={false} />
                <Tooltip content={<SellerTooltip />} cursor={{ fill: "rgba(34,197,94,0.08)" }} />
                <Bar
                  dataKey="booksListed"
                  name="Books Listed"
                  fill="url(#sellerBarGradient)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={56}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Books Sold Analytics" subtitle="Monthly trend · completed / paid orders only">
          {salesData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRAD_TO} />
                    <stop offset="55%" stopColor={GRAD_MID} />
                    <stop offset="100%" stopColor={GRAD_FROM} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#667C72" }}
                  axisLine={{ stroke: "#D3EEDC" }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} axisLine={false} tickLine={false} />
                <Tooltip content={<SalesTooltip />} cursor={{ fill: "rgba(34,197,94,0.08)" }} />
                <Bar
                  dataKey="booksSold"
                  name="Books Sold"
                  fill="url(#salesBarGradient)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={56}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Average Profit"
        subtitle="Customer purchase price − admin purchase price · monthly trend"
      >
        {profitData.length ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat label="Total Profit" value={`₹${(analytics?.totalProfit || 0).toLocaleString("en-IN")}`} />
              <MiniStat label="Average Profit / Sale" value={`₹${(analytics?.avgProfit || 0).toLocaleString("en-IN")}`} />
              <MiniStat label="Purchase Cost" value={`₹${(analytics?.purchaseCost || 0).toLocaleString("en-IN")}`} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={profitData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D3EEDC" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667C72" }} axisLine={{ stroke: "#D3EEDC" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667C72" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ProfitTooltip />} cursor={{ stroke: GRAD_MID, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke={GRAD_FROM}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: GRAD_MID, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/70 border border-mint-line rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-muted font-mono truncate">{label}</p>
      <p className="text-sm sm:text-base font-bold text-ink truncate">{value}</p>
    </div>
  );
}

function ProfitTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipShell
      title={d.month}
      rows={[
        { label: "Total Profit", value: `₹${d.profit.toLocaleString("en-IN")}` },
        { label: "Avg. Profit / Sale", value: `₹${d.avgProfit.toLocaleString("en-IN")}` },
        { label: "Sales Count", value: d.salesCount.toLocaleString("en-IN") },
      ]}
    />
  );
}

/* ---------------------------- UI subcomponents --------------------------- */

function ChartCard({ title, subtitle, children }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="font-bold text-lg text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-muted font-mono mt-0.5">{subtitle}</p>}
      </div>
      <div className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-mint-line rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-[#16A34A]/10 transition-all duration-300">
        <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#4ADE80]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">{children}</div>
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

function TooltipShell({ title, rows }) {
  return (
    <div className="rounded-xl border border-mint-line bg-white/95 backdrop-blur-md shadow-lg px-4 py-3 min-w-[190px]">
      <p className="text-sm font-semibold text-ink mb-1.5">{title}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted font-mono">{r.label}</span>
            <span className="font-semibold text-forest">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipShell
      title={d.name}
      rows={[
        { label: "Total Books Listed", value: d.booksListed.toLocaleString("en-IN") },
        { label: "Avg. Listed Price", value: `₹${d.avgPrice.toLocaleString("en-IN")}` },
        { label: "Total Value", value: `₹${d.totalValue.toLocaleString("en-IN")}` },
      ]}
    />
  );
}

function SalesTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipShell
      title={d.month}
      rows={[
        { label: "Total Books Sold", value: d.booksSold.toLocaleString("en-IN") },
        { label: "Total Revenue", value: `₹${d.revenue.toLocaleString("en-IN")}` },
        { label: "Avg. Selling Price", value: `₹${d.avgPrice.toLocaleString("en-IN")}` },
      ]}
    />
  );
}

/* ------------------------------ data helpers ------------------------------ */

// Groups every listed book (from real pickup requests) by seller and
// computes total books listed, average listed price and total listed value.
// Uses the same price fallback chain used elsewhere in the admin panel
// (finalPrice -> aiEstimatedPrice), so figures stay consistent with the
// Books/Sellers tables.
function buildSellerListingData(pickups = []) {
  const map = {};
  for (const p of pickups) {
    const sellerName = p.seller?.name || "Unknown Seller";
    const books = p.books || [];
    for (const b of books) {
      // NOTE: never fall back to sellerProposedPrice here — that's the
      // seller's original ask, kept only for reference/history. Once a
      // price is accepted, finalPrice is set and must be used everywhere.
      const price = b.finalPrice || b.aiEstimatedPrice || 0;
      if (!map[sellerName]) map[sellerName] = { count: 0, value: 0 };
      map[sellerName].count += 1;
      map[sellerName].value += price;
    }
  }
  return Object.entries(map)
    .map(([name, { count, value }]) => ({
      name,
      booksListed: count,
      totalValue: Math.round(value),
      avgPrice: count > 0 ? Math.round(value / count) : 0,
    }))
    .sort((a, b) => b.booksListed - a.booksListed);
}

// Merges the two month-indexed trends already returned by /admin/analytics
// (salesTrend: booksSold per month, avgPriceTrend: avgPrice per month) into
// a single per-month dataset with revenue derived from the two, without
// requiring any backend changes.
function buildBooksSoldData(analytics) {
  const salesTrend = analytics?.salesTrend || [];
  const avgPriceTrend = analytics?.avgPriceTrend || [];
  const avgByMonth = {};
  for (const m of avgPriceTrend) avgByMonth[m.month] = m.avgPrice || 0;

  return salesTrend.map((m) => {
    const avgPrice = avgByMonth[m.month] ?? 0;
    const revenue = Math.round(avgPrice * m.booksSold);
    return {
      month: m.month,
      booksSold: m.booksSold,
      avgPrice,
      revenue,
    };
  });
}