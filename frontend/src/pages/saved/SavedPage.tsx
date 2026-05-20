import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { savedApi } from "../../api/saved";
import { DocCard } from "../../components/document/DocCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

export default function SavedPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["saved", debouncedQ, page],
    queryFn: () => savedApi.list(page, 20, debouncedQ || undefined),
  });

  const pastes  = data?.pastes   ?? [];
  const total   = data?.total    ?? 0;
  const hasMore = data?.has_more ?? false;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 4px" }}>Saved Pastes</h1>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>
            {total > 0 ? `${total} paste${total !== 1 ? "s" : ""}` : "Pastes you've saved for later"}
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search saved pastes..."
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
      ) : pastes.length === 0 ? (
        <EmptyState
          title={debouncedQ ? "No results found" : "Nothing saved yet"}
          description={
            debouncedQ
              ? "Try a different search term."
              : "Browse public pastes and hit Save to collect them here."
          }
        />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {pastes.map((paste) => (
              <div key={paste.slug}>
                <div style={{ fontSize: 11, color: "var(--color-ink-3)", marginBottom: 4, paddingLeft: 2, fontFamily: "monospace" }}>
                  by @{paste.owner_handle}
                </div>
                <DocCard
                  slug={paste.slug}
                  title={paste.title}
                  language={paste.language}
                  privacy={paste.privacy}
                  description={paste.description}
                  created_at={paste.created_at}
                />
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
