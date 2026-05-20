import { useState, useCallback, createContext, useContext } from "react";

interface Toast { id: number; message: string; type: "success" | "error" | "info" }
interface ToastContextValue { toast: (message: string, type?: Toast["type"]) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  const accent = { success: "#4ADE80", error: "#f87171", info: "#60a5fa" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 60, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="animate-fade-up"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              background: "var(--color-card)",
              border: `1px solid ${accent[t.type]}30`,
              borderLeft: `3px solid ${accent[t.type]}`,
              borderRadius: 10,
              boxShadow: "var(--shadow-card-hover)",
              fontSize: 13,
              color: "var(--color-ink)",
              maxWidth: 320,
            }}
          >
            <span style={{ color: accent[t.type], flexShrink: 0 }}>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
