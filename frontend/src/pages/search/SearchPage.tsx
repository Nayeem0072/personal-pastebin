import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import { DocCard } from "../../components/document/DocCard";
import { Button } from "../../components/ui/Button";
import { SUPPORTED_LANGUAGES } from "../../lib/constants";
import { PageLoader } from "../../components/ui/Spinner";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [lang, setLang] = useState(params.get("lang") ?? "");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSearch({
    q: params.get("q") ?? "",
    lang: lang || undefined,
    page,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setParams({ q, ...(lang && { lang }) });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Explore Pastes</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555568", width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search for code, configs, notes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pp-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="pp-input"
          style={{ width: 160 }}
        >
          <option value="">All languages</option>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <PageLoader />}

      {data && (
        <>
          <p style={{ fontSize: 13, color: "#555568" }}>
            {data.total} result{data.total !== 1 ? "s" : ""}
            {params.get("q") && <> for "<span style={{ color: "#8A8AA2" }}>{params.get("q")}</span>"</>}
          </p>

          {data.results.length === 0 ? (
            <p style={{ color: "#555568", textAlign: "center", padding: "48px 0", fontSize: 14 }}>
              No results found. Try different keywords.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {data.results.map((r) => (
                <DocCard key={r.slug} {...r} owner_handle={r.owner_handle} excerpt={r.excerpt} />
              ))}
            </div>
          )}

          {(data.has_more || page > 1) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {page > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
              )}
              {data.has_more && (
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
