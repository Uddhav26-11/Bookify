import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS } from "../utils/sortBooks";

export default function SortDropdown({ value, onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-mint-line rounded-lg pl-8 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest"
      >
        <option value="">Sort / Filter</option>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
