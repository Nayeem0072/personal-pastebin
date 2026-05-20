import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface Command {
  label: string;
  hint: string;
  path: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  userHandle: string | undefined;
}

export function CommandPalette({ open, onClose, userHandle }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: Command[] = useMemo(() => [
    { label: "New Paste", hint: "/new", path: "/new" },
    { label: "Search", hint: "/search", path: "/search" },
    { label: "Saved Pastes", hint: "/saved", path: "/saved" },
    { label: "Shared with me", hint: "/shared", path: "/shared" },
    { label: "My Groups", hint: "/groups", path: "/groups" },
    { label: "Settings", hint: "/settings", path: "/settings" },
    ...(userHandle ? [{ label: `Profile (@${userHandle})`, hint: `/${userHandle}`, path: `/${userHandle}` }] : []),
  ], [userHandle]);

  const filtered = query
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function execute(cmd: Command) {
    navigate(cmd.path);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter") {
      if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999,
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 14, width: "100%", maxWidth: 520, margin: "0 16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)", overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: "var(--color-ink)", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Command list */}
        <div style={{ maxHeight: 320, overflowY: "auto", padding: "6px 6px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 13, color: "var(--color-ink-3)" }}>
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.path}
                onClick={() => execute(cmd)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "none",
                  background: i === selectedIndex ? "var(--color-blue-dim)" : "transparent",
                  color: i === selectedIndex ? "var(--color-ink)" : "var(--color-ink-2)",
                  fontSize: 14, cursor: "pointer", textAlign: "left", gap: 12,
                  transition: "background 100ms",
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span>{cmd.label}</span>
                <span style={{ fontSize: 11, color: "var(--color-ink-3)", fontFamily: "monospace", flexShrink: 0 }}>
                  {cmd.hint}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "8px 14px", borderTop: "1px solid var(--color-border)",
          display: "flex", gap: 14, fontSize: 11, color: "var(--color-ink-3)",
        }}>
          <span><kbd style={{ fontFamily: "monospace" }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily: "monospace" }}>Enter</kbd> open</span>
          <span><kbd style={{ fontFamily: "monospace" }}>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
