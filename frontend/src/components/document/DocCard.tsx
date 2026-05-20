import { Link } from "react-router-dom";
import { PrivacyBadge } from "../ui/Badge";
import { formatRelative, truncate } from "../../lib/utils";

const LANG_COLORS: Record<string, string> = {
  typescript: "#4C9BE8", javascript: "#F7DF1E", python: "#4B9CD3",
  rust: "#F17050", go: "#00ADD8", java: "#F0A040", bash: "#6EC97A",
  sql: "#F05050", html: "#F06529", css: "#5B9BD5", json: "#9A9AAF",
  markdown: "#7CACF8", yaml: "#F06060", toml: "#D4845A", dockerfile: "#4A9EF5",
};

interface DocCardProps {
  slug: string;
  title: string;
  language: string;
  privacy: string;
  description?: string | null;
  created_at: number;
  owner_handle?: string;
  excerpt?: string;
  weekly_views?: number;
}

export function DocCard({ slug, title, language, privacy, description, created_at, owner_handle, excerpt, weekly_views }: DocCardProps) {
  const langColor = LANG_COLORS[language] ?? "#7A7A96";

  return (
    <Link to={`/docs/${slug}`} className="block group">
      <div className="relative pp-card p-4 transition-all duration-200">
        {/* Lang stripe */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: langColor }}
        />

        <div className="pl-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-[14px] font-medium text-ink-2 group-hover:text-ink transition-colors line-clamp-1 flex-1">
              {title}
            </h3>
            <PrivacyBadge privacy={privacy} />
          </div>

          {excerpt ? (
            <p
              className="text-[11px] font-mono text-ink-3 line-clamp-2 mb-3 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: excerpt }}
            />
          ) : description ? (
            <p className="text-[12px] text-ink-3 line-clamp-2 mb-3 leading-relaxed">{description}</p>
          ) : (
            <div className="mb-3" />
          )}

          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: langColor, background: `${langColor}14` }}
            >
              {language}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-ink-3">
              {weekly_views != null && weekly_views > 0 && (
                <span style={{ color: "#f97316" }}>{weekly_views} views</span>
              )}
              {owner_handle && <span>@{owner_handle}</span>}
              <span>{formatRelative(created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
