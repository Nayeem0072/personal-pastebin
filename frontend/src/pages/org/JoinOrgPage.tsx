import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orgsApi } from "../../api/organizations";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/utils";
import { useEffect } from "react";

export default function JoinOrgPage() {
  const { code } = useParams<{ code: string }>();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite-preview", code],
    queryFn: () => orgsApi.previewJoin(code!),
  });

  const join = useMutation({
    mutationFn: () => orgsApi.joinByCode(code!),
    onSuccess: (d) => {
      navigate(`/orgs/${d.org.slug}`);
      toast(d.already_member ? "You're already a member!" : `Joined ${d.org.name}!`, "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  // Auto-join when user arrives already logged in (e.g. redirected after signup/login)
  useEffect(() => {
    if (isLoggedIn && data && !join.isPending && !join.isSuccess && !join.isError) {
      join.mutate();
    }
  }, [isLoggedIn, data]);

  if (isLoading || authLoading) return <PageLoader />;

  if (error) {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>Invalid Invite</h1>
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>{(error as any).message}</p>
      </div>
    );
  }

  const { org, invite } = data!;

  return (
    <div style={{ maxWidth: 440, margin: "64px auto 0" }}>
      <div className="pp-card" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, #00C4FF, #0080FF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#fff",
          margin: "0 auto",
        }}>
          {org.name[0].toUpperCase()}
        </div>

        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 4px" }}>{org.name}</h1>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0, fontFamily: "monospace" }}>@{org.slug}</p>
        </div>

        {org.description && (
          <p style={{ fontSize: 14, color: "var(--color-ink-2)", margin: 0 }}>{org.description}</p>
        )}

        {(invite.expires_at || invite.max_uses) && (
          <div style={{ fontSize: 12, color: "var(--color-ink-3)", display: "flex", flexDirection: "column", gap: 4 }}>
            {invite.expires_at && <span>Expires: {formatDate(invite.expires_at)}</span>}
            {invite.max_uses && <span>Uses: {invite.use_count} / {invite.max_uses}</span>}
          </div>
        )}

        {isLoggedIn ? (
          <Button style={{ width: "100%" }} onClick={() => join.mutate()} loading={join.isPending || join.isSuccess}>
            Join {org.name}
          </Button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>Create an account or sign in to join.</p>
            <Button
              style={{ width: "100%" }}
              onClick={() => navigate(`/signup?next=/join/${code}`)}
            >
              Sign Up to Join
            </Button>
            <Button
              variant="secondary"
              style={{ width: "100%" }}
              onClick={() => navigate(`/login?next=/join/${code}`)}
            >
              Sign In to Join
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
