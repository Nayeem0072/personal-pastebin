import { useEffect } from "react";
import { createPortal } from "react-dom";

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

  return createPortal(
    <>
      {/* Fixed backdrop — always covers the full viewport */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.3)" }}
        className="animate-fade-in"
      />
      {/* Scrollable container sits on top of backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 51,
        overflowY: "auto",
        display: "flex", justifyContent: "center",
        padding: "60px 16px 32px",
        pointerEvents: "none",
      }}>
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
          alignSelf: "flex-start",
          marginBottom: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          pointerEvents: "auto",
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
    </>,
    document.body
  );
}
