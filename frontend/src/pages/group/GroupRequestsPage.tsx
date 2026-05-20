import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../api/groups";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { formatRelative } from "../../lib/utils";

export default function GroupRequestsPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["group-requests", slug],
    queryFn: () => groupsApi.getRequests(slug!),
  });

  const review = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      groupsApi.reviewRequest(slug!, id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-requests", slug] });
      qc.invalidateQueries({ queryKey: ["group-members", slug] });
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>Join Requests</h1>

      {data?.requests.length === 0 ? (
        <EmptyState title="No pending requests" description="When users request to join, they'll appear here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data?.requests.map((req) => (
            <div key={req.id} className="pp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #00C4FF, #0080FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                }}>
                  {(req.display_name ?? req.handle)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", fontFamily: "monospace", marginBottom: 2 }}>
                    @{req.handle}
                  </div>
                  {req.message && (
                    <p style={{ fontSize: 12, color: "var(--color-ink-2)", margin: "0 0 2px" }}>"{req.message}"</p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>{formatRelative(req.created_at)}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  onClick={() => review.mutate({ id: req.id, action: "approve" })}
                  loading={review.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => review.mutate({ id: req.id, action: "reject" })}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
