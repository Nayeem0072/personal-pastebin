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
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }}
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
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: width,
          alignSelf: "flex-start",
          marginBottom: 32,
          boxShadow: "var(--shadow-card-hover)",
          pointerEvents: "auto",
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: "var(--color-hover-overlay)", border: "none", cursor: "pointer",
                borderRadius: 8, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-ink-2)", transition: "background 150ms",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--color-nav-hover-bg)")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--color-hover-overlay)")}
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
