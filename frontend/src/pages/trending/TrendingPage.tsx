import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { trendingApi } from "../../api/trending";
import { DocCard } from "../../components/document/DocCard";

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

export default function TrendingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => trendingApi.list(20, 7),
    staleTime: 60_000,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.3px" }}>
            Trending this week
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>
          Most-viewed public pastes in the last {data?.window_days ?? 7} days
        </p>
      </div>

      {isLoading && (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Loading…</p>
      )}

      {!isLoading && data?.results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-ink-3)" }}>
          <p style={{ fontSize: 15, marginBottom: 12 }}>No trending pastes yet.</p>
          <Link to="/new" style={{ color: "var(--color-blue)", textDecoration: "none", fontSize: 14 }}>
            Be the first to share one →
          </Link>
        </div>
      )}

      {data && data.results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {data.results.map((doc, i) => (
            <div key={doc.slug} style={{ position: "relative" }}>
              {i < 3 && (
                <div style={{
                  position: "absolute", top: 8, right: 8, zIndex: 1,
                  width: 22, height: 22, borderRadius: "50%",
                  background: RANK_COLORS[i],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#0A0A14",
                }}>
                  {i + 1}
                </div>
              )}
              <DocCard
                slug={doc.slug}
                title={doc.title}
                language={doc.language}
                privacy={doc.privacy}
                created_at={doc.created_at}
                owner_handle={doc.owner_handle}
                weekly_views={doc.weekly_views}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
