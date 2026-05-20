import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";
import { DocCard } from "../../components/document/DocCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/utils";

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user: me } = useAuth();
  const [filterQ, setFilterQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => usersApi.getProfile(handle!),
  });

  if (isLoading) return <PageLoader />;
  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#555568", fontSize: 14 }}>{(error as any).message}</p>
    </div>
  );

  const { user, docs } = data!;
  const isSelf = me?.id === user.id;

  const filteredDocs = isSelf && filterQ
    ? docs.filter((doc: any) =>
        doc.title.toLowerCase().includes(filterQ.toLowerCase()) ||
        doc.language.toLowerCase().includes(filterQ.toLowerCase())
      )
    : docs;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, #00C4FF, #0080FF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, color: "#0A0A14", flexShrink: 0,
        }}>
          {((user as any).display_name ?? (user as any).handle ?? "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>
              {(user as any).display_name ?? (user as any).handle}
            </h1>
            {isSelf && (
              <Link to="/settings">
                <Button variant="ghost" size="sm">Edit Profile</Button>
              </Link>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#555568", margin: "0 0 6px", fontFamily: "monospace" }}>
            @{(user as any).handle}
          </p>
          {(user as any).bio && (
            <p style={{ fontSize: 14, color: "#8A8AA2", margin: "0 0 6px" }}>{(user as any).bio}</p>
          )}
          <p style={{ fontSize: 12, color: "#555568", margin: 0 }}>
            Joined {formatDate((user as any).created_at)}
          </p>
        </div>
      </div>

      {/* Docs */}
      <section>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#555568", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Pastes {docs.length > 0 && <span style={{ color: "#38383F", fontWeight: 400, fontSize: 11 }}>({filterQ ? `${filteredDocs.length}/` : ""}{docs.length})</span>}
          </h2>
          {isSelf && docs.length > 0 && (
            <Input
              placeholder="Filter pastes..."
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              prefix={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }
            />
          )}
        </div>
        {docs.length === 0 ? (
          <EmptyState
            title="No pastes yet"
            description={isSelf ? "Create your first paste to share code or configs." : undefined}
            action={isSelf ? <Link to="/new"><Button>Create Paste</Button></Link> : undefined}
          />
        ) : filteredDocs.length === 0 ? (
          <EmptyState title="No results" description="No pastes match your filter." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {filteredDocs.map((doc: any) => (
              <DocCard key={doc.slug} {...doc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
