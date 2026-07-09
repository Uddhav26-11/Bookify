// Signature element: a grade dial that visualizes the AI condition score (0-100)
export default function ConditionMeter({ grade = 0, size = 96, label }) {
  const radius = 40;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.max(0, Math.min(100, grade));
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? "#14713F" : pct >= 60 ? "#E8A33D" : "#D9614F";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 100 55" width={size} height={size * 0.6}>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#D3EEDC" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontFamily="IBM Plex Mono, monospace" fill="#142420" fontWeight="500">
          {pct}
        </text>
      </svg>
      {label && <span className="text-xs text-muted font-mono mt-1">{label}</span>}
    </div>
  );
}
