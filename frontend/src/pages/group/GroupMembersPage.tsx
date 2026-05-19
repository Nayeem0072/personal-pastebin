import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../api/groups";
import { useAuth } from "../../hooks/useAuth";
import { RoleBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/utils";

export default function GroupMembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["group-members", slug],
    queryFn: () => groupsApi.getMembers(slug!),
  });

  const promote = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      groupsApi.updateMember(slug!, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-members", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (userId: number) => groupsApi.removeMember(slug!, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-members", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  if (isLoading) return <PageLoader />;

  const { members, my_role } = data!;
  const isAdminOrAbove = my_role === "owner" || my_role === "admin";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Members</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {members.map((m) => (
          <div key={m.id} className="pp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #00C4FF, #0080FF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff",
              }}>
                {(m.display_name ?? m.handle)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#EEEEF5", fontFamily: "monospace" }}>@{m.handle}</span>
                  {m.display_name && <span style={{ fontSize: 12, color: "#555568" }}>{m.display_name}</span>}
                  <RoleBadge role={m.role} />
                </div>
                <p style={{ fontSize: 12, color: "#555568", margin: 0 }}>Joined {formatDate(m.joined_at)}</p>
              </div>
            </div>

            {isAdminOrAbove && m.id !== user?.id && m.role !== "owner" && (
              <div style={{ display: "flex", gap: 8 }}>
                {m.role === "member" ? (
                  <Button variant="ghost" size="sm" onClick={() => promote.mutate({ userId: m.id, role: "admin" })}>
                    Make Admin
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => promote.mutate({ userId: m.id, role: "member" })}>
                    Demote
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => remove.mutate(m.id)}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
