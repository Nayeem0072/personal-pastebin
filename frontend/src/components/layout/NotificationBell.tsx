import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendsApi } from "../../api/sends";
import { groupsApi } from "../../api/groups";
import { useToast } from "../ui/Toast";
import { formatRelative } from "../../lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: countData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: sendsApi.getUnreadCount,
    refetchInterval: 10_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: sendsApi.getNotifications,
    enabled: isOpen,
    refetchInterval: isOpen ? 10_000 : false,
  });

  const markRead = useMutation({
    mutationFn: (sendId: number) => sendsApi.markRead(sendId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: sendsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const respondToInvite = useMutation({
    mutationFn: ({ inviteId, action }: { inviteId: number; action: "accept" | "decline" }) =>
      groupsApi.respondToHandleInvite(inviteId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast("This invitation has expired or was cancelled", "error");
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on outside click — must exclude both the button wrapper and the portal dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = countData?.count ?? 0;
  const notifications = notifData?.notifications ?? [];

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const left = Math.max(8, rect.right - dropdownWidth);
      setDropdownPos({ top: rect.bottom + 8, left });
    }
    setIsOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: "relative", flexShrink: 0,
          width: 34, height: 34, borderRadius: "50%",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isOpen ? "rgba(0,196,255,0.15)" : "rgba(255,255,255,0.06)",
          color: isOpen ? "#00C4FF" : "#8A8AA2",
          transition: "background 150ms, color 150ms",
        }}
        onMouseOver={e => { if (!isOpen) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#EEEEF5"; } }}
        onMouseOut={e => { if (!isOpen) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#8A8AA2"; } }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5A4.5 4.5 0 003.5 6v3.5L2 11h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            minWidth: 14, height: 14, borderRadius: 7,
            background: "#00C4FF", color: "#0A0A14",
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div ref={dropdownRef} style={{
          position: "fixed",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: Math.min(320, window.innerWidth - 16),
          background: "#2E2E38",
          border: "1px solid #38383F",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #38383F",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EEEEF5" }}>Notifications</span>
            <button
              onClick={() => markAllRead.mutate()}
              disabled={unread === 0 || markAllRead.isPending}
              style={{
                background: "none", border: "none", cursor: unread === 0 ? "default" : "pointer",
                fontSize: 11, color: unread === 0 ? "#555568" : "#00C4FF",
                padding: 0,
              }}
            >
              Mark all read
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#555568", fontSize: 13 }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                if (n.type === "document_send") {
                  return (
                    <button
                      key={`doc-${n.id}`}
                      onClick={() => {
                        markRead.mutate(n.id);
                        navigate(`/docs/${n.doc_slug}`);
                        setIsOpen(false);
                      }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        width: "100%", padding: "12px 16px",
                        background: n.read_at === null ? "rgba(0,196,255,0.04)" : "none",
                        border: "none", borderBottom: "1px solid #38383F",
                        cursor: "pointer", textAlign: "left",
                        transition: "background 150ms",
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseOut={e => (e.currentTarget.style.background = n.read_at === null ? "rgba(0,196,255,0.04)" : "none")}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                        background: n.read_at === null ? "#00C4FF" : "transparent",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, color: "#EEEEF5", margin: "0 0 2px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {n.doc_title}
                        </p>
                        <p style={{ fontSize: 11, color: "#555568", margin: 0 }}>
                          <span style={{ fontFamily: "monospace" }}>@{n.sender_handle}</span>
                          {" · "}{formatRelative(n.created_at)}
                        </p>
                        {n.message && (
                          <p style={{ fontSize: 11, color: "#8A8AA2", margin: "3px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            "{n.message}"
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }

                // group_invite
                return (
                  <div
                    key={`invite-${n.id}`}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 16px",
                      background: n.read_at === null ? "rgba(0,196,255,0.04)" : "none",
                      borderBottom: "1px solid #38383F",
                    }}
                    onClick={() => {
                      if (n.read_at === null) {
                        groupsApi.markHandleInviteRead(n.id);
                        qc.invalidateQueries({ queryKey: ["unread-count"] });
                        qc.invalidateQueries({ queryKey: ["notifications"] });
                      }
                    }}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                      background: n.read_at === null ? "#00C4FF" : "transparent",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#EEEEF5", margin: "0 0 2px", fontWeight: 500 }}>
                        Group invite: <span style={{ color: "#00C4FF" }}>{n.group_name}</span>
                      </p>
                      <p style={{ fontSize: 11, color: "#555568", margin: "0 0 6px" }}>
                        From <span style={{ fontFamily: "monospace" }}>@{n.inviter_handle}</span>
                        {" · "}{formatRelative(n.created_at)}
                      </p>
                      {n.message && (
                        <p style={{ fontSize: 11, color: "#8A8AA2", margin: "0 0 8px", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{n.message}"
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            respondToInvite.mutate({ inviteId: n.id, action: "accept" });
                          }}
                          disabled={respondToInvite.isPending}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                            background: "#00C4FF", color: "#0A0A14", fontSize: 11, fontWeight: 600,
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            respondToInvite.mutate({ inviteId: n.id, action: "decline" });
                          }}
                          disabled={respondToInvite.isPending}
                          style={{
                            padding: "4px 10px", borderRadius: 6,
                            border: "1px solid #38383F", cursor: "pointer",
                            background: "none", color: "#8A8AA2", fontSize: 11, fontWeight: 600,
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid #38383F" }}>
            <Link
              to="/shared"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: 12, color: "#00C4FF", textDecoration: "none" }}
            >
              View all shared pastes →
            </Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
