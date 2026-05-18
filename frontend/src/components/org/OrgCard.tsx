import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import type { Org } from "../../api/organizations";

interface OrgCardProps {
  org: Org;
  role?: string;
  memberCount?: number;
}

export function OrgCard({ org, role, memberCount }: OrgCardProps) {
  return (
    <Link to={`/orgs/${org.slug}`} className="block group">
      <div className="pp-card p-4 transition-all duration-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-[12px] font-bold font-mono" style={{ color: "#00C4FF" }}>
              {org.name[0].toUpperCase()}
            </div>
            <h3 className="text-[14px] font-medium text-ink-2 group-hover:text-ink transition-colors">
              {org.name}
            </h3>
          </div>
          <div className="flex gap-1 shrink-0">
            {org.visibility === "private" && <Badge variant="default">private</Badge>}
            {role && <Badge variant="blue">{role}</Badge>}
          </div>
        </div>

        <p className="text-[11px] font-mono text-ink-3 mb-2">/{org.slug}</p>

        {org.description && (
          <p className="text-[12px] text-ink-3 line-clamp-2 leading-relaxed">{org.description}</p>
        )}

        {memberCount !== undefined && (
          <p className="text-[11px] text-ink-3 mt-2.5">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        )}
      </div>
    </Link>
  );
}
