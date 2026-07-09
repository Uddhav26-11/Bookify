const STYLES = {
  Requested: "bg-mint text-forest",
  Assigned: "bg-amber/15 text-amber",
  "Pending Pickup": "bg-amber/15 text-amber",
  "Under Verification": "bg-amber/15 text-amber",
  Approved: "bg-forest/10 text-forest",
  Collected: "bg-forest/10 text-forest",
  Paid: "bg-forest text-white",
  Completed: "bg-ink text-white",
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STYLES[status] || "bg-mint text-forest"}`}>
      {status}
    </span>
  );
}
