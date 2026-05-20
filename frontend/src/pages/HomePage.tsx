import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search";
import { useSearch } from "../hooks/useSearch";
import { useAuth } from "../hooks/useAuth";
import { DocCard } from "../components/document/DocCard";
import { Button } from "../components/ui/Button";

function RecentPublicDocs() {
  const { data } = useQuery({
    queryKey: ["recent-docs"],
    queryFn: () =>
      searchApi.search({ q: "the a in", page: 1, limit: 9 }).catch(() => ({
        results: [], total: 0, page: 1, limit: 9, has_more: false,
      })),
    staleTime: 60_000,
  });

  if (!data?.results.length) return null;

  return (
    <section>
      <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
        Recent Pastes
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {data.results.map((r) => (
          <DocCard key={r.slug} {...r} owner_handle={r.owner_handle} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const search = useSearch({ q });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Hero */}
      <section style={{ paddingTop: 48, paddingBottom: 8 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999,
            border: "1px solid rgba(0,196,255,0.2)",
            background: "var(--color-blue-dim)",
            fontSize: 12, color: "#00C4FF", fontWeight: 600,
            marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C4FF" }} />
            Fast · Lightweight · Yours
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 800, color: "var(--color-ink)", lineHeight: 1.15, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
            Share code.<br />
            <span style={{ color: "var(--color-ink-3)" }}>Not clutter.</span>
          </h1>

          <p style={{ fontSize: 15, color: "var(--color-ink-2)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 420 }}>
            Paste code, configs, and notes. Share with teams or the world. Syntax highlighted. Lightning fast.
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 520 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-ink-3)", width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search public pastes..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pp-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <Button type="submit" disabled={q.length < 2}>Search</Button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
            <Link to="/signup"><Button size="lg">Get Started</Button></Link>
            <Link to="/new"><Button variant="ghost" size="lg">Quick Paste →</Button></Link>
          </div>
        </div>
      </section>

      {/* Live search results */}
      {q.trim().length >= 2 && (
        <section>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            {search.isLoading ? "Searching..." : `Results for "${q}" (${search.data?.total ?? 0})`}
          </h2>
          {search.data?.results.length === 0 && !search.isLoading ? (
            <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Nothing found. Try different keywords.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {search.data?.results.map((r) => (
                <DocCard key={r.slug} {...r} owner_handle={r.owner_handle} excerpt={r.excerpt} />
              ))}
            </div>
          )}
          {search.data?.has_more && (
            <Link to={`/search?q=${encodeURIComponent(q)}`} style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: "#00C4FF", textDecoration: "none" }}>
              See all results →
            </Link>
          )}
        </section>
      )}

      {!q && <RecentPublicDocs />}

    </div>
  );
}
