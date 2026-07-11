// Frontend/src/components/admin/StatCard.jsx
export default function StatCard({ icon: Icon, label, value, isCurrency, growth, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-mint-line rounded-2xl p-5 flex items-center gap-4 shadow-sm text-left transition-all duration-300 ${
        onClick ? "hover:shadow-lg hover:shadow-[#16A34A]/10 hover:-translate-y-1 hover:border-[#22C55E]/50 cursor-pointer" : "hover:-translate-y-0.5"
      }`}
    >
      {/* soft gradient glow on hover */}
      <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-[#4ADE80]/20 to-[#16A34A]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#16A34A] via-[#22C55E] to-[#4ADE80] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#16A34A]/30 transition-transform duration-300 group-hover:scale-105">
        <Icon size={20} strokeWidth={2.1} />
      </div>
      <div className="relative min-w-0">
        <p className="text-xs text-muted font-mono truncate tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-ink tracking-tight">
            {isCurrency ? `₹${(value || 0).toLocaleString("en-IN")}` : (value || 0).toLocaleString("en-IN")}
          </p>
          {growth != null && (
            <span className={`text-xs font-semibold ${growth >= 0 ? "text-forest" : "text-rose"}`}>
              {growth >= 0 ? "+" : ""}
              {growth}%
            </span>
          )}
        </div>
      </div>
    </Comp>
  );
}
