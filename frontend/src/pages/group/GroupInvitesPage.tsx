import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../api/groups";
import { usersApi } from "../../api/users";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatRelative } from "../../lib/utils";

export default function GroupInvitesPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  // Handle invite form state
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce user search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(handle), 250);
    return () => clearTimeout(t);
  }, [handle]);

  const { data: suggestData } = useQuery({
    queryKey: ["user-search", debouncedQ],
    queryFn: () => usersApi.search(debouncedQ),
    enabled: debouncedQ.length >= 1 && showSuggestions,
  });

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

  const suggestions = suggestData?.users ?? [];

  // Code invite queries
  const { data: codeInvitesData, isLoading } = useQuery({
    queryKey: ["group-invites", slug],
    queryFn: () => groupsApi.getInvites(slug!),
  });

  // Handle invite list
  const { data: handleInvitesData } = useQuery({
    queryKey: ["group-handle-invites", slug],
    queryFn: () => groupsApi.getHandleInvites(slug!),
  });

  const createCodeInvite = useMutation({
    mutationFn: () => groupsApi.createInvite(slug!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-invites", slug] });
      toast("Invite link created", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const revokeCodeInvite = useMutation({
    mutationFn: (code: string) => groupsApi.deleteInvite(slug!, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-invites", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  const sendHandleInvite = useMutation({
    mutationFn: () => groupsApi.sendHandleInvite(slug!, handle, message || undefined),
    onSuccess: (data) => {
      toast(`Invite sent to @${data.invitee_handle}`, "success");
      setHandle("");
      setMessage("");
      setShowSuggestions(false);
      qc.invalidateQueries({ queryKey: ["group-handle-invites", slug] });
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const cancelHandleInvite = useMutation({
    mutationFn: (id: number) => groupsApi.cancelHandleInvite(slug!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-handle-invites", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      {/* ── Invite by Handle ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Invite by Handle</h2>

        <div className="pp-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Handle input with autocomplete */}
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8A8AA2", marginBottom: 6 }}>
              User Handle
            </label>
            <input
              ref={inputRef}
              className="pp-input"
              placeholder="@username"
              value={handle}
              onChange={(e) => { setHandle(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
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
                  background: "#28282F", border: "1px solid #38383F", borderRadius: 10,
                  marginTop: 4, overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {suggestions.map((u) => (
                  <button
                    key={u.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setHandle(u.handle);
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "9px 12px",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: "1px solid #38383F", textAlign: "left",
                      transition: "background 100ms",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
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
                      <p style={{ fontSize: 13, color: "#EEEEF5", margin: 0, fontWeight: 500 }}>@{u.handle}</p>
                      {u.display_name && (
                        <p style={{ fontSize: 11, color: "#555568", margin: 0 }}>{u.display_name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8A8AA2", marginBottom: 6 }}>
              Message <span style={{ color: "#555568", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="pp-input"
              style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
            />
          </div>

          <Button
            onClick={() => sendHandleInvite.mutate()}
            loading={sendHandleInvite.isPending}
            disabled={!handle.trim()}
          >
            Send Invite
          </Button>
        </div>

        {/* Pending handle invites list */}
        {handleInvitesData && handleInvitesData.invites.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#8A8AA2", margin: 0 }}>Pending Invites</h3>
            {handleInvitesData.invites.map((inv) => (
              <div key={inv.id} className="pp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, #00C4FF, #0080FF)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff",
                  }}>
                    {inv.invitee_handle[0].toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#EEEEF5", fontFamily: "monospace" }}>@{inv.invitee_handle}</span>
                    {inv.invitee_display_name && (
                      <span style={{ fontSize: 12, color: "#555568", marginLeft: 8 }}>{inv.invitee_display_name}</span>
                    )}
                    <p style={{ fontSize: 11, color: "#555568", margin: "2px 0 0" }}>
                      Invited by @{inv.inviter_handle} · {formatRelative(inv.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelHandleInvite.mutate(inv.id)}
                  loading={cancelHandleInvite.isPending}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Invite Links (existing code-based) ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Invite Links</h2>
          <Button onClick={() => createCodeInvite.mutate()} loading={createCodeInvite.isPending}>
            + Create Link
          </Button>
        </div>

        {codeInvitesData?.invites.length === 0 ? (
          <p style={{ color: "#555568", fontSize: 14 }}>No active invite links. Create one to share with others.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {codeInvitesData?.invites.map((inv) => (
              <div key={inv.id} className="pp-card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <code style={{ fontSize: 13, fontFamily: "monospace", color: "#00C4FF", wordBreak: "break-all", display: "block" }}>
                      {window.location.origin}/join/{inv.code}
                    </code>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#555568", marginTop: 6 }}>
                      <span>Used: {inv.use_count}{inv.max_uses ? `/${inv.max_uses}` : ""}</span>
                      {inv.expires_at && <span>Expires: {formatDate(inv.expires_at)}</span>}
                      <span>By @{inv.created_by_handle}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(inv.code)}>
                      {copied === inv.code ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => revokeCodeInvite.mutate(inv.code)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
