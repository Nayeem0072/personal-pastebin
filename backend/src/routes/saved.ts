import { Hono } from "hono";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";
import { canViewDoc } from "../lib/docAccess";
import type { Variables, Document } from "../types/index";

const app = new Hono<{ Variables: Variables }>();

// POST /api/saved — save a paste
app.post("/", requireAuth, (c) => {
  const me = c.var.user;
  return c.req.json().then((b: any) => {
    const { slug } = b ?? {};
    if (!slug) return c.json({ error: "slug is required" }, 400);

    const doc = db.query<Document, [string]>("SELECT * FROM documents WHERE slug = ?").get(slug);
    if (!doc) return c.json({ error: "Not found" }, 404);

    if (doc.owner_id === me.id) return c.json({ error: "Cannot save your own paste" }, 400);
    if (!canViewDoc(doc, me.id)) return c.json({ error: "Forbidden" }, 403);
    if (doc.privacy === "private") return c.json({ error: "Cannot save a private paste" }, 400);

    const result = db
      .prepare("INSERT OR IGNORE INTO saved_pastes (user_id, doc_id) VALUES (?, ?)")
      .run(me.id, doc.id);

    if (result.changes === 0) return c.json({ error: "Already saved" }, 409);

    return c.json({ ok: true, saved_at: Math.floor(Date.now() / 1000) }, 201);
  });
});

// GET /api/saved/check/:slug — is this paste saved by the current user?
// Must be registered before /:slug (DELETE) so "check" isn't treated as a slug param
app.get("/check/:slug", requireAuth, (c) => {
  const me = c.var.user;
  const { slug } = c.req.param();

  const row = db
    .query<{ is_saved: number }, [string, number]>(
      `SELECT EXISTS(
         SELECT 1 FROM saved_pastes sp
         JOIN documents d ON sp.doc_id = d.id
         WHERE d.slug = ? AND sp.user_id = ?
       ) AS is_saved`
    )
    .get(slug, me.id);

  return c.json({ is_saved: row?.is_saved === 1 });
});

// DELETE /api/saved/:slug — unsave (idempotent)
app.delete("/:slug", requireAuth, (c) => {
  const me = c.var.user;
  const { slug } = c.req.param();

  const doc = db
    .query<{ id: number }, [string]>("SELECT id FROM documents WHERE slug = ?")
    .get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);

  db.prepare("DELETE FROM saved_pastes WHERE user_id = ? AND doc_id = ?").run(me.id, doc.id);
  return c.json({ ok: true });
});

// GET /api/saved — paginated list of saved pastes the user currently has access to
app.get("/", requireAuth, (c) => {
  const me = c.var.user;
  const page   = Math.max(1, Number(c.req.query("page")  ?? 1));
  const limit  = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const offset = (page - 1) * limit;
  const q      = c.req.query("q") ?? null;
  const filter = q ? `%${q}%` : null;

  // Dynamic access filter — mirrors canViewDoc but as inline SQL to avoid N+1.
  // Rule: group pastes disappear automatically when user leaves the group.
  const accessFilter = `(
    d.privacy = 'public'
    OR (
      d.privacy = 'group'
      AND d.group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = d.group_id AND gm.user_id = ?
      )
    )
    OR (
      d.privacy = 'private'
      AND EXISTS (
        SELECT 1 FROM document_shares ds2
        WHERE ds2.doc_id = d.id AND ds2.user_id = ?
      )
    )
  )`;

  type SavedRow = {
    saved_at:      number;
    slug:          string;
    title:         string;
    language:      string;
    privacy:       string;
    group_id:      number | null;
    description:   string | null;
    created_at:    number;
    owner_handle:  string;
    owner_display: string | null;
  };

  const pastes = db
    .query<SavedRow, [number, number, number, string | null, string | null, string | null, number, number]>(
      `SELECT
         sp.saved_at,
         d.slug,
         d.title,
         d.language,
         d.privacy,
         d.group_id,
         d.description,
         d.created_at,
         u.handle       AS owner_handle,
         u.display_name AS owner_display
       FROM saved_pastes sp
       JOIN documents d ON sp.doc_id  = d.id
       JOIN users     u ON d.owner_id = u.id
       WHERE sp.user_id = ?
         AND ${accessFilter}
         AND (? IS NULL OR d.title LIKE ? OR u.handle LIKE ?)
       ORDER BY sp.saved_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(me.id, me.id, me.id, filter, filter, filter, limit, offset);

  const { cnt } = db
    .query<{ cnt: number }, [number, number, number, string | null, string | null, string | null]>(
      `SELECT COUNT(*) AS cnt
       FROM saved_pastes sp
       JOIN documents d ON sp.doc_id  = d.id
       JOIN users     u ON d.owner_id = u.id
       WHERE sp.user_id = ?
         AND ${accessFilter}
         AND (? IS NULL OR d.title LIKE ? OR u.handle LIKE ?)`
    )
    .get(me.id, me.id, me.id, filter, filter, filter)!;

  return c.json({ pastes, page, limit, total: cnt, has_more: offset + pastes.length < cnt });
});

export default app;
