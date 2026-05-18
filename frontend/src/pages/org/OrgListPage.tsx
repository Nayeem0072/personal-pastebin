import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { orgsApi } from "../../api/organizations";
import { OrgCard } from "../../components/org/OrgCard";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ApiError } from "../../api/client";

export default function OrgListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => orgsApi.list(),
    retry: (_, err) => !(err instanceof ApiError && err.status === 401),
  });

  if (isLoading) return <PageLoader />;

  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#555568", fontSize: 14 }}>{(error as any).message}</p>
    </div>
  );

  const orgs = data?.orgs ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: "0 0 4px" }}>Organizations</h1>
          <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>Teams and groups you belong to</p>
        </div>
        <Link to="/orgs/new">
          <Button>+ New Organization</Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          title="No organizations yet"
          description="Create an organization to collaborate with others."
          action={<Link to="/orgs/new"><Button>Create Organization</Button></Link>}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} role={(org as any).role} />
          ))}
        </div>
      )}
    </div>
  );
}
