import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendsApi } from "../../api/sends";
import { DocCard } from "../../components/document/DocCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

export default function SharedPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search query
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["inbox", debouncedQ, page],
    queryFn: () => sendsApi.getInbox(page, 20, debouncedQ || undefined),
  });

  // Mark all as read when page mounts
  const markAllRead = useMutation({
    mutationFn: sendsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unread-count"] }),
  });
  useEffect(() => {
    markAllRead.mutate();
  }, []);

  const sends = data?.sends ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.has_more ?? false;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: "0 0 4px" }}>Shared with me</h1>
          <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>
            {total > 0 ? `${total} paste${total !== 1 ? "s" : ""}` : "Pastes others have sent you"}
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title or sender..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        prefix={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        }
      />

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : sends.length === 0 ? (
        <EmptyState
          title={debouncedQ ? "No results found" : "Nothing shared with you yet"}
          description={debouncedQ ? "Try a different search term." : "When someone sends you a paste, it will appear here."}
        />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {sends.map((send) => (
              <div key={send.send_id} style={{ position: "relative" }}>
                {send.read_at === null && (
                  <div style={{
                    position: "absolute", top: 10, right: 10, zIndex: 1,
                    width: 8, height: 8, borderRadius: "50%", background: "#00C4FF",
                  }} />
                )}
                <div>
                  <div style={{ fontSize: 11, color: "#555568", marginBottom: 4, paddingLeft: 2, fontFamily: "monospace" }}>
                    from @{send.sender_handle}
                  </div>
                  <DocCard
                    slug={send.slug}
                    title={send.title}
                    language={send.language}
                    privacy={send.privacy}
                    description={send.message ?? undefined}
                    created_at={send.sent_at}
                  />
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center" }}>
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
