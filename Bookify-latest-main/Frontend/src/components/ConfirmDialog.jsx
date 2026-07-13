import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

// -----------------------------------------------------------------------
// Custom confirm dialog — replaces window.confirm() everywhere in the app.
// Renders as a small on-brand card that slides in from the bottom-left
// corner (like a notification), instead of the browser's native popup.
// Promise-based so call sites can keep an `if (!ok) return;` style.
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
        <div className="fixed inset-0 z-[110] pointer-events-none">
          {/* Invisible click-catcher so clicking outside the card cancels,
              without dimming/blocking the rest of the screen like a modal */}
          <div className="absolute inset-0 pointer-events-auto" onClick={() => close(false)} />

          {/* Notification-style card — slides in from the bottom-left corner */}
          <div
            className="absolute bottom-4 left-4 w-[calc(100%-2rem)] sm:w-96 pointer-events-auto bg-white rounded-2xl p-5 shadow-2xl shadow-ink/20 border border-mint-line animate-toast-in"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  state.danger ? "bg-rose/10 text-rose" : "bg-mint text-forest"
                }`}
              >
                <AlertTriangle size={19} />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-display font-semibold text-ink text-base leading-tight">{state.title}</h3>
                {state.message && (
                  <p className="text-sm text-muted mt-1 leading-relaxed">{state.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => close(false)}
                className="flex-1 py-2 rounded-full border border-mint-line text-ink font-semibold text-sm hover:bg-mint transition"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 py-2 rounded-full text-white font-semibold text-sm transition ${
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