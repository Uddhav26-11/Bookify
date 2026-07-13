import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

// -----------------------------------------------------------------------
// Custom confirm dialog — replaces window.confirm() everywhere in the app.
// Renders as a bottom-sheet on mobile and a centered card on desktop,
// styled to match the rest of the app instead of the browser's native
// popup. Promise-based so call sites can keep an `if (!ok) return;` style.
//
// Usage:
//   const confirm = useConfirm();
//   const ok = await confirm({ message: "Delete this book?" });
//   if (!ok) return;
// -----------------------------------------------------------------------

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, title, confirmLabel, cancelLabel, danger }
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === "string" ? { message: options } : options || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: opts.title || "Are you sure?",
        message: opts.message || "",
        confirmLabel: opts.confirmLabel || "Confirm",
        cancelLabel: opts.cancelLabel || "Cancel",
        danger: opts.danger !== false, // default to danger styling (most confirms here are deletes)
      });
    });
  }, []);

  const close = (result) => {
    setState(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => close(false)}
          />

          {/* Dialog — slides up from bottom on mobile, fades+scales in on desktop */}
          <div
            className="relative bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl shadow-ink/20 animate-sheet-up sm:animate-scale-in"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-mint-line mx-auto mb-4" />

            <div className="flex items-start gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  state.danger ? "bg-rose/10 text-rose" : "bg-mint text-forest"
                }`}
              >
                <AlertTriangle size={19} />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-display font-semibold text-ink text-lg leading-tight">{state.title}</h3>
              </div>
            </div>

            {state.message && (
              <p className="text-sm text-muted mt-2 ml-[52px] leading-relaxed">{state.message}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => close(false)}
                className="flex-1 py-2.5 rounded-full border border-mint-line text-ink font-semibold text-sm hover:bg-mint transition"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 py-2.5 rounded-full text-white font-semibold text-sm transition ${
                  state.danger ? "bg-rose hover:brightness-95" : "btn-brand"
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}