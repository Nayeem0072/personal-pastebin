import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 440 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }}
        className="animate-fade-in"
      />
      <div
        className="animate-fade-up"
        style={{
          position: "relative",
          background: "#2E2E38",
          border: "1px solid #38383F",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: width,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#EEEEF5", margin: 0 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer",
                borderRadius: 8, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#8A8AA2", transition: "background 150ms",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
