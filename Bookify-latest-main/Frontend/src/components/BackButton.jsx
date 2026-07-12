import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Reusable "Back" button used on every page except Landing.
 *
 * Behavior:
 *  - Goes back using browser history (navigate(-1)) by default.
 *  - If there's no meaningful history to go back to (e.g. the user landed
 *    directly on this page via a shared link / new tab), it falls back to
 *    `fallback` instead of leaving them on a blank/broken screen.
 *
 * Props:
 *  - fallback: path to redirect to when there's no back history (default "/")
 *  - label: button text (default "Back")
 *  - className: extra classes to merge (e.g. for page-specific spacing)
 *  - sticky: pins the button under the navbar on mobile (default false)
 */
export default function BackButton({ fallback = "/", label = "Back", className = "", sticky = false }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // window.history.state.idx is set by react-router's browser history —
    // idx > 0 means there's actual in-app history to pop back to.
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-mint-line bg-white/90 backdrop-blur px-3.5 py-2 text-sm font-medium text-ink shadow-sm hover:bg-mint hover:border-forest/30 hover:text-forest active:scale-[0.97] transition-all ${
        sticky ? "sticky top-20 z-30 sm:static" : ""
      } ${className}`}
    >
      <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}
