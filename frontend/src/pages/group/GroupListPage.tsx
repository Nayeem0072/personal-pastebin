import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "../../api/groups";
import { GroupCard } from "../../components/group/GroupCard";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ApiError } from "../../api/client";

export default function GroupListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-groups"],
    queryFn: () => groupsApi.list(),
    retry: (_, err) => !(err instanceof ApiError && err.status === 401),
  });

  if (isLoading) return <PageLoader />;

  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#555568", fontSize: 14 }}>{(error as any).message}</p>
    </div>
  );

  const groups = data?.groups ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: "0 0 4px" }}>Groups</h1>
          <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>Teams and groups you belong to</p>
        </div>
        <Link to="/groups/new">
          <Button>+ New Group</Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create a group to collaborate with others."
          action={<Link to="/groups/new"><Button>Create Group</Button></Link>}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} role={(group as any).role} />
          ))}
        </div>
      )}
    </div>
  );
}
