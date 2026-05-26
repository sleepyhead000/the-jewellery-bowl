"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, React.CSSProperties> = {
  success: { borderColor: "var(--color-success)", background: "color-mix(in oklab, var(--color-success), transparent 86%)" },
  error: { borderColor: "var(--color-danger)", background: "color-mix(in oklab, var(--color-danger), transparent 86%)" },
  warning: { borderColor: "var(--color-warning)", background: "color-mix(in oklab, var(--color-warning), transparent 86%)" },
  info: { borderColor: "var(--color-accent)", background: "color-mix(in oklab, var(--color-accent), transparent 88%)" },
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 border-l-4 px-4 py-3 shadow-lg animate-in slide-in-from-right"
            style={styles[t.type]}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm flex-1 text-[var(--color-text-primary)]">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
