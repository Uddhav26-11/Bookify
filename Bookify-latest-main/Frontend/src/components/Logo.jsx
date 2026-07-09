export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 rounded-lg bg-forest flex items-center justify-center">
        <div className="w-3 h-3 rounded-sm bg-lime" />
      </div>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">Bookify</span>
    </div>
  );
}
