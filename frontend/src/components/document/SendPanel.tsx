import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { sendsApi } from "../../api/sends";
import { usersApi } from "../../api/users";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

interface Props {
  slug: string;
  privacy: string;
}

export function SendPanel({ slug, privacy }: Props) {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(recipient), 250);
    return () => clearTimeout(t);
  }, [recipient]);

  const { data: suggestData } = useQuery({
    queryKey: ["user-search", debouncedQ],
    queryFn: () => usersApi.search(debouncedQ),
    enabled: debouncedQ.length >= 1 && showSuggestions,
  });

  const suggestions = suggestData?.users ?? [];

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const send = useMutation({
    mutationFn: () =>
      sendsApi.send({ doc_slug: slug, handle_or_email: recipient, message: message || undefined }),
    onSuccess: (data) => {
      toast(`Sent to @${data.sent_to.handle}`, "success");
      setRecipient("");
      setMessage("");
      setShowSuggestions(false);
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  if (privacy === "private") {
    return (
      <p style={{ fontSize: 13, color: "var(--color-ink-3)", textAlign: "center", padding: "12px 0" }}>
        Private documents cannot be sent to other users.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Recipient input with autocomplete */}
      <div style={{ position: "relative" }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-ink-2)", marginBottom: 6 }}>
          Recipient
        </label>
        <input
          ref={inputRef}
          className="pp-input"
          placeholder="Handle or email address"
          value={recipient}
          onChange={(e) => { setRecipient(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && recipient && !showSuggestions) send.mutate();
            if (e.key === "Escape") setShowSuggestions(false);
          }}
          autoComplete="off"
          style={{ width: "100%" }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10,
              marginTop: 4, overflow: "hidden",
              boxShadow: "var(--shadow-card-hover)",
            }}
          >
            {suggestions.map((u) => (
              <button
                key={u.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setRecipient(u.handle);
                  setShowSuggestions(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "9px 12px",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: "1px solid var(--color-border)", textAlign: "left",
                  transition: "background 100ms",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "var(--color-nav-hover-bg)")}
                onMouseOut={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, #00C4FF, #0080FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#0A0A14",
                }}>
                  {u.handle[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "var(--color-ink)", margin: 0, fontWeight: 500 }}>@{u.handle}</p>
                  {u.display_name && (
                    <p style={{ fontSize: 11, color: "var(--color-ink-3)", margin: 0 }}>{u.display_name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Optional message */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-ink-2)", marginBottom: 6 }}>
          Message <span style={{ color: "var(--color-ink-3)", fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          className="pp-input"
          style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </div>

      <Button
        onClick={() => send.mutate()}
        loading={send.isPending}
        disabled={!recipient.trim()}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M11.5 1.5L1.5 5.5l4 2 2 4 4-10z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M5.5 7.5l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Send
      </Button>
    </div>
  );
}
