// Frontend/src/components/admin/StatCard.jsx
export default function StatCard({ icon: Icon, label, value, isCurrency, growth, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`bg-white border border-mint-line rounded-2xl p-5 flex items-center gap-4 shadow-sm text-left transition-all duration-200 ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5 hover:border-forest cursor-pointer" : ""
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center text-forest shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted font-mono truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-ink">
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