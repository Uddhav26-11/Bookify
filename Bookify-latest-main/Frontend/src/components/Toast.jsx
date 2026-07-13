import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

// -----------------------------------------------------------------------
// Custom toast/snackbar system — replaces window.alert() everywhere in the
// app with a small, on-brand notification that slides in from the
// bottom-right instead of a browser-native popup.
//
// Usage:
//   const toast = useToast();
//   toast.success("Saved!");
//   toast.error("Something went wrong");
//   toast.info("Heads up...");
// -----------------------------------------------------------------------

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: "border-forest/30 bg-white text-ink [&_svg]:text-forest",
  error: "border-rose/30 bg-white text-ink [&_svg]:text-rose",
  info: "border-mint-line bg-white text-ink [&_svg]:text-forest",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const api = {
    success: (msg, duration) => push(msg, "success", duration),
    error: (msg, duration) => push(msg, "error", duration),
    info: (msg, duration) => push(msg, "info", duration),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg shadow-ink/5 px-4 py-3 animate-toast-in ${STYLES[t.type]}`}
              role="alert"
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 text-muted hover:text-ink transition"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}