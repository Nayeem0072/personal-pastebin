import { Hono } from "hono";
import { db } from "../db/client";

const app = new Hono();

// ── Helpers ────────────────────────────────────────────────────────────────

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const LANG_COLORS: Record<string, string> = {
  typescript: "#3178c6", javascript: "#f7df1e", python: "#3572A5",
  rust: "#ce412b", go: "#00ADD8", java: "#b07219", cpp: "#f34b7d",
  c: "#555555", csharp: "#178600", ruby: "#701516", swift: "#F05138",
  kotlin: "#A97BFF", php: "#4F5D95", html: "#e34c26", css: "#563d7c",
  json: "#292929", yaml: "#cb171e", sql: "#e38c00", bash: "#89e051",
  sh: "#89e051", markdown: "#083fa1", dockerfile: "#384d54",
};

function langColor(lang: string) {
  return LANG_COLORS[lang] ?? "#555568";
}

// ── Paste image ────────────────────────────────────────────────────────────

app.get("/image/:slug", (c) => {
  const { slug } = c.req.param();

  const row = db.query<
    { title: string; content: string; language: string; privacy: string; owner_id: number },
    [string]
  >("SELECT title, content, language, privacy, owner_id FROM documents WHERE slug = ?").get(slug);

  const owner = row
    ? db.query<{ handle: string }, [number]>(
        "SELECT handle FROM users WHERE id = ?"
      ).get(row.owner_id)
    : null;

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=86400");

  if (!row || row.privacy !== "public") {
    return c.body(privateSvg());
  }

  const title = esc(trunc(row.title || "Untitled", 55));
  const handle = esc(owner?.handle ?? "");
  const lang = esc(row.language);
  const color = langColor(row.language);

  const lines = row.content
    .split("\n")
    .slice(0, 6)
    .map((l) => esc(trunc(l, 80)));

  const codeLines = lines
    .map((l, i) => `<text x="60" y="${380 + i * 26}" font-family="monospace" font-size="15" fill="#8A8AA2">${l}</text>`)
    .join("\n    ");

  return c.body(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#1C1C22"/>
  <!-- Top strip -->
  <rect width="1200" height="60" fill="#28282F"/>
  <!-- Wordmark -->
  <text x="40" y="38" font-family="monospace" font-size="18" font-weight="700" fill="#8A8AA2">clippr</text>
  <!-- Language badge -->
  <rect x="${1200 - 40 - (lang.length * 9 + 20)}" y="18" width="${lang.length * 9 + 20}" height="26" rx="6" fill="${color}" opacity="0.2"/>
  <text x="${1200 - 40 - (lang.length * 9 + 20) + 10}" y="35" font-family="monospace" font-size="13" fill="${color}">${lang}</text>
  <!-- Title -->
  <text x="60" y="130" font-family="monospace" font-size="36" font-weight="700" fill="#EEEEF5">${title}</text>
  <!-- Author -->
  <text x="62" y="168" font-family="monospace" font-size="18" fill="#8A8AA2">@${handle}</text>
  <!-- Divider -->
  <line x1="60" y1="194" x2="1140" y2="194" stroke="#38383F" stroke-width="1"/>
  <!-- Code lines -->
  ${codeLines}
  <!-- Bottom accent -->
  <rect y="626" width="1200" height="4" rx="3" fill="#00C4FF"/>
</svg>`);
});

// ── Paste meta shell ───────────────────────────────────────────────────────

app.get("/meta/:slug", (c) => {
  const { slug } = c.req.param();
  const frontendUrl = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  const backendOrigin = new URL(c.req.url).origin;
  const dest = `${frontendUrl}/docs/${slug}`;

  const row = db.query<
    { title: string; content: string; privacy: string; owner_id: number },
    [string]
  >("SELECT title, content, privacy, owner_id FROM documents WHERE slug = ?").get(slug);

  c.header("Content-Type", "text/html; charset=utf-8");

  if (!row || row.privacy !== "public") {
    return c.body(redirectOnly(dest));
  }

  const title = esc((row.title || "Untitled") + " — clippr");
  const description = esc(trunc(row.content.trimStart().replace(/\s+/g, " "), 160));
  const imageUrl = esc(`${backendOrigin}/api/og/image/${slug}`);
  const pageUrl = esc(dest);

  return c.body(metaShell({ title, description, imageUrl, pageUrl, dest }));
});

// ── Invite image ───────────────────────────────────────────────────────────

app.get("/image/invite/:code", (c) => {
  const { code } = c.req.param();

  const invite = db.query<{ group_id: number; use_count: number; max_uses: number | null; expires_at: number | null }, [string]>(
    "SELECT group_id, use_count, max_uses, expires_at FROM group_code_invites WHERE code = ?"
  ).get(code);

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=3600");

  if (!invite) return c.body(inviteUnavailableSvg());

  const expired =
    (invite.expires_at && invite.expires_at < Date.now() / 1000) ||
    (invite.max_uses && invite.use_count >= invite.max_uses);
  if (expired) return c.body(inviteUnavailableSvg());

  const group = db.query<{ name: string; description: string | null }, [number]>(
    "SELECT name, description FROM groups WHERE id = ?"
  ).get(invite.group_id);

  if (!group) return c.body(inviteUnavailableSvg());

  const memberCount = (
    db.query<{ cnt: number }, [number]>(
      "SELECT COUNT(*) as cnt FROM group_members WHERE group_id = ?"
    ).get(invite.group_id)
  )?.cnt ?? 0;

  const name = esc(trunc(group.name, 50));
  const desc = group.description ? esc(trunc(group.description, 100)) : "";
  const membersLabel = esc(`${memberCount} ${memberCount === 1 ? "member" : "members"}`);
  const initial = esc(group.name[0]?.toUpperCase() ?? "G");

  return c.body(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1C1C22"/>
  <rect width="1200" height="60" fill="#28282F"/>
  <text x="40" y="38" font-family="monospace" font-size="18" font-weight="700" fill="#8A8AA2">clippr</text>
  <!-- Group avatar -->
  <rect x="60" y="100" width="80" height="80" rx="22" fill="url(#grad)"/>
  <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00C4FF"/><stop offset="100%" stop-color="#0080FF"/></linearGradient></defs>
  <text x="100" y="152" text-anchor="middle" font-family="monospace" font-size="36" font-weight="700" fill="#fff">${initial}</text>
  <!-- Invite label -->
  <text x="60" y="220" font-family="monospace" font-size="16" fill="#8A8AA2">You're invited to join</text>
  <!-- Group name -->
  <text x="60" y="275" font-family="monospace" font-size="42" font-weight="700" fill="#EEEEF5">${name}</text>
  ${desc ? `<text x="60" y="318" font-family="monospace" font-size="18" fill="#8A8AA2">${desc}</text>` : ""}
  <!-- Members pill -->
  <rect x="60" y="${desc ? 346 : 330}" width="${membersLabel.length * 10 + 24}" height="30" rx="8" fill="#38383F"/>
  <text x="${60 + 12}" y="${desc ? 366 : 350}" font-family="monospace" font-size="14" fill="#8A8AA2">${membersLabel}</text>
  <rect y="626" width="1200" height="4" rx="3" fill="#00C4FF"/>
</svg>`);
});

// ── Invite meta shell ──────────────────────────────────────────────────────

app.get("/meta/invite/:code", (c) => {
  const { code } = c.req.param();
  const frontendUrl = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  const backendOrigin = new URL(c.req.url).origin;
  const dest = `${frontendUrl}/join/${code}`;

  c.header("Content-Type", "text/html; charset=utf-8");

  const invite = db.query<{ group_id: number; use_count: number; max_uses: number | null; expires_at: number | null }, [string]>(
    "SELECT group_id, use_count, max_uses, expires_at FROM group_code_invites WHERE code = ?"
  ).get(code);

  if (!invite) return c.body(redirectOnly(dest));

  const expired =
    (invite.expires_at && invite.expires_at < Date.now() / 1000) ||
    (invite.max_uses && invite.use_count >= invite.max_uses);
  if (expired) return c.body(redirectOnly(dest));

  const group = db.query<{ name: string; description: string | null }, [number]>(
    "SELECT name, description FROM groups WHERE id = ?"
  ).get(invite.group_id);

  if (!group) return c.body(redirectOnly(dest));

  const memberCount = (
    db.query<{ cnt: number }, [number]>(
      "SELECT COUNT(*) as cnt FROM group_members WHERE group_id = ?"
    ).get(invite.group_id)
  )?.cnt ?? 0;

  const title = esc(`Join ${group.name} on clippr`);
  const description = esc(
    group.description
      ? trunc(group.description, 160)
      : `Join this group and collaborate with ${memberCount} ${memberCount === 1 ? "member" : "members"} on clippr.`
  );
  const imageUrl = esc(`${backendOrigin}/api/og/image/invite/${code}`);
  const pageUrl = esc(dest);

  return c.body(metaShell({ title, description, imageUrl, pageUrl, dest }));
});

// ── SVG / HTML helpers ─────────────────────────────────────────────────────

function privateSvg() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1C1C22"/>
  <rect width="1200" height="60" fill="#28282F"/>
  <text x="40" y="38" font-family="monospace" font-size="18" font-weight="700" fill="#8A8AA2">clippr</text>
  <text x="600" y="295" text-anchor="middle" font-family="monospace" font-size="28" fill="#555568">Private paste</text>
  <text x="600" y="335" text-anchor="middle" font-family="monospace" font-size="16" fill="#38383F">This paste is not public</text>
  <rect y="626" width="1200" height="4" rx="3" fill="#00C4FF"/>
</svg>`;
}

function inviteUnavailableSvg() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1C1C22"/>
  <rect width="1200" height="60" fill="#28282F"/>
  <text x="40" y="38" font-family="monospace" font-size="18" font-weight="700" fill="#8A8AA2">clippr</text>
  <text x="600" y="295" text-anchor="middle" font-family="monospace" font-size="28" fill="#555568">Invite unavailable</text>
  <text x="600" y="335" text-anchor="middle" font-family="monospace" font-size="16" fill="#38383F">This invite link has expired or is no longer valid</text>
  <rect y="626" width="1200" height="4" rx="3" fill="#00C4FF"/>
</svg>`;
}

function redirectOnly(dest: string) {
  const d = esc(dest);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><script>window.location.replace("${d}");</script></head><body><noscript><meta http-equiv="refresh" content="0;url=${d}"></noscript></body></html>`;
}

function metaShell({ title, description, imageUrl, pageUrl, dest }: {
  title: string; description: string; imageUrl: string; pageUrl: string; dest: string;
}) {
  const d = esc(dest);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="clippr">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <script>window.location.replace("${d}");</script>
</head>
<body>
  <noscript><meta http-equiv="refresh" content="0;url=${d}"></noscript>
</body>
</html>`;
}

export { app as ogRoutes };
