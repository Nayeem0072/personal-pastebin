import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { orgsApi } from "../../api/organizations";
import { useAuth } from "../../hooks/useAuth";
import { DocCard } from "../../components/document/DocCard";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";

export default function OrgPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["org", slug],
    queryFn: () => orgsApi.get(slug!),
  });

  const { data: docsData } = useQuery({
    queryKey: ["org-docs", slug],
    queryFn: () => orgsApi.getDocuments(slug!),
    enabled: !!data,
  });

  if (isLoading) return <PageLoader />;
  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>{(error as any).message}</p>
    </div>
  );

  const { org, role, member_count } = data!;
  const isAdminOrAbove = role === "owner" || role === "admin";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #00C4FF, #0080FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff",
            }}>
              {org.name[0].toUpperCase()}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>{org.name}</h1>
            {org.visibility === "private" && <Badge variant="default">Private</Badge>}
            {role && <Badge variant="orange">{role}</Badge>}
          </div>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: "0 0 6px", fontFamily: "monospace" }}>/{org.slug}</p>
          {org.description && <p style={{ fontSize: 14, color: "var(--color-ink-2)", margin: "0 0 4px" }}>{org.description}</p>}
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
            {member_count} member{member_count !== 1 ? "s" : ""}
          </p>
        </div>

        {isAdminOrAbove && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Link to={`/orgs/${slug}/invites`}>
              <Button variant="ghost" size="sm">Invites</Button>
            </Link>
            <Link to={`/orgs/${slug}/requests`}>
              <Button variant="ghost" size="sm">Requests</Button>
            </Link>
            <Link to={`/orgs/${slug}/settings`}>
              <Button variant="ghost" size="sm">Settings</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Nav tabs */}
      {role && (
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
          {[
            { label: "Pastes", href: `/orgs/${slug}` },
            { label: "Members", href: `/orgs/${slug}/members` },
          ].map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              style={{
                padding: "8px 14px", fontSize: 14, color: "var(--color-ink-2)",
                textDecoration: "none", borderBottom: "2px solid transparent",
                transition: "color 150ms",
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      {/* Docs */}
      <section>
        {!docsData?.documents.length ? (
          <EmptyState
            title="No pastes yet"
            description="Org members can create pastes visible only to this org."
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {docsData.documents.map((r) => (
              <DocCard key={r.slug} {...r} owner_handle={r.owner_handle} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
