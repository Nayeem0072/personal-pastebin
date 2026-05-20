import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgsApi } from "../../api/organizations";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/utils";

export default function OrgInvitesPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org-invites", slug],
    queryFn: () => orgsApi.getInvites(slug!),
  });

  const create = useMutation({
    mutationFn: () => orgsApi.createInvite(slug!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-invites", slug] });
      toast("Invite created", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const revoke = useMutation({
    mutationFn: (code: string) => orgsApi.deleteInvite(slug!, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-invites", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>Invite Links</h1>
        <Button onClick={() => create.mutate()} loading={create.isPending}>
          + Create Invite
        </Button>
      </div>

      {data?.invites.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>No active invite links. Create one to invite members.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data?.invites.map((inv) => (
            <div key={inv.id} className="pp-card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <code style={{ fontSize: 13, fontFamily: "monospace", color: "#00C4FF", wordBreak: "break-all", display: "block" }}>
                    {window.location.origin}/join/{inv.code}
                  </code>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--color-ink-3)", marginTop: 6 }}>
                    <span>Used: {inv.use_count}{inv.max_uses ? `/${inv.max_uses}` : ""}</span>
                    {inv.expires_at && <span>Expires: {formatDate(inv.expires_at)}</span>}
                    <span>By @{inv.created_by_handle}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => copyLink(inv.code)}>
                    {copied === inv.code ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => revoke.mutate(inv.code)}>
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
