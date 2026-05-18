import { Hono } from "hono";
import { db } from "../db/client";
import { optionalAuth } from "../middleware/optionalAuth";
import type { AuthUser } from "../types";

const app = new Hono<{ Variables: { user: AuthUser | null } }>();

// GET /api/search?q=&org=&lang=&page=&limit=
app.get("/", optionalAuth, (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) return c.json({ error: "q must be at least 2 characters" }, 400);

  const org = c.req.query("org");
  const lang = c.req.query("lang");
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const offset = (page - 1) * limit;

  const me = c.var.user;

  // Sanitize FTS5 query — remove special chars, add prefix wildcard
  const sanitized = q.replace(/['"*\[\]()^~]/g, " ").trim().split(/\s+/).filter(Boolean).join(" ") + "*";

  // Build privacy filter params
  const params: (string | number)[] = [sanitized];
  const privacyClauses: string[] = ["d.privacy = 'public'"];

  if (me) {
    privacyClauses.push(`d.owner_id = ${me.id}`);
    privacyClauses.push(
      `(d.privacy = 'org' AND d.org_id IN (SELECT org_id FROM org_members WHERE user_id = ${me.id}))`
    );
    privacyClauses.push(
      `d.id IN (SELECT doc_id FROM document_shares WHERE user_id = ${me.id})`
    );
  }

  let orgFilter = "";
  if (org) {
    const orgRow = db.query<{ id: number }, [string]>(
      "SELECT id FROM organizations WHERE slug = ?"
    ).get(org);
    if (orgRow) {
      orgFilter = `AND d.org_id = ${orgRow.id}`;
    }
  }

  let langFilter = "";
  if (lang) {
    langFilter = `AND d.language = '${lang.replace(/'/g, "''")}'`;
  }

  const privacyFilter = `(${privacyClauses.join(" OR ")})`;

  const sql = `
    SELECT
      d.slug, d.title, d.language, d.privacy, d.org_id, d.created_at,
      u.handle as owner_handle, u.display_name as owner_display_name,
      snippet(documents_fts, 2, '<mark>', '</mark>', '...', 20) as excerpt
    FROM documents_fts
    JOIN documents d ON documents_fts.rowid = d.id
    JOIN users u ON d.owner_id = u.id
    WHERE documents_fts MATCH ?
      AND ${privacyFilter}
      ${orgFilter}
      ${langFilter}
    ORDER BY rank
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countSql = `
    SELECT COUNT(*) as cnt
    FROM documents_fts
    JOIN documents d ON documents_fts.rowid = d.id
    WHERE documents_fts MATCH ?
      AND ${privacyFilter}
      ${orgFilter}
      ${langFilter}
  `;

  try {
    const results = db.query(sql).all(...params);
    const { cnt } = (db.query(countSql).get(...params) as any) ?? { cnt: 0 };
    return c.json({ results, total: cnt, page, limit, has_more: offset + results.length < cnt });
  } catch (err: any) {
    // FTS5 syntax error (e.g. bad query) → return empty
    if (err?.message?.includes("fts5")) {
      return c.json({ results: [], total: 0, page, limit, has_more: false });
    }
    throw err;
  }
});

export default app;
