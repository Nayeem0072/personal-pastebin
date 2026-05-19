import { Hono } from "hono";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { generateSlug } from "../lib/slug";
import { highlightCode } from "../lib/highlight";
import { canViewDoc } from "../lib/docAccess";
import type { Variables, AuthUser, Document } from "../types";

type Vars = Variables & { user: AuthUser | null };
const app = new Hono<{ Variables: Vars }>();

// POST /api/documents
app.post("/", requireAuth, async (c) => {
  const me = c.var.user!;
  const body = await c.req.json();
  const { title, content, language = "plaintext", description, privacy = "public", group_id } = body ?? {};

  if (!content) return c.json({ error: "content is required" }, 400);
  if (!["public", "group", "private"].includes(privacy)) {
    return c.json({ error: "privacy must be public, group, or private" }, 400);
  }

  if (privacy === "group") {
    if (!group_id) return c.json({ error: "group_id required for group privacy" }, 400);
    const member = db
      .query<{ user_id: number }, [number, number]>(
        "SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?"
      )
      .get(group_id, me.id);
    if (!member) return c.json({ error: "You are not a member of that group" }, 403);
  }

  const slug = generateSlug();
  const highlighted_html = await highlightCode(content, language);

  db.prepare(
    `INSERT INTO documents (slug, title, content, language, description, highlighted_html, privacy, group_id, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(slug, title ?? "Untitled", content, language, description ?? null, highlighted_html, privacy, group_id ?? null, me.id);

  return c.json({ slug, title: title ?? "Untitled", language, privacy, created_at: Math.floor(Date.now() / 1000) }, 201);
});

// GET /api/documents — list own docs
app.get("/", requireAuth, (c) => {
  const me = c.var.user!;
  const page = Number(c.req.query("page") ?? 1);
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const offset = (page - 1) * limit;

  const docs = db
    .query<
      { slug: string; title: string; language: string; privacy: string; group_id: number | null; description: string | null; created_at: number; updated_at: number },
      [number, number, number]
    >(
      "SELECT slug, title, language, privacy, group_id, description, created_at, updated_at FROM documents WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    .all(me.id, limit, offset);

  const total = (db.query<{ cnt: number }, [number]>(
    "SELECT COUNT(*) as cnt FROM documents WHERE owner_id = ?"
  ).get(me.id))!.cnt;

  return c.json({ docs, page, limit, total, has_more: offset + docs.length < total });
});

// GET /api/documents/:slug
app.get("/:slug", optionalAuth, (c) => {
  const { slug } = c.req.param();
  const me = c.var.user;

  const doc = db.query<Document, [string]>(
    "SELECT * FROM documents WHERE slug = ?"
  ).get(slug);

  if (!doc) return c.json({ error: "Not found" }, 404);

  if (!canViewDoc(doc, me?.id ?? null)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Attach owner info
  const owner = db.query<{ handle: string; display_name: string | null }, [number]>(
    "SELECT handle, display_name FROM users WHERE id = ?"
  ).get(doc.owner_id);

  return c.json({ doc: { ...doc, owner } });
});

// PATCH /api/documents/:slug
app.patch("/:slug", requireAuth, async (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const doc = db.query<Document, [string]>("SELECT * FROM documents WHERE slug = ?").get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);
  if (doc.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const { title, content, language, description, privacy, group_id } = body ?? {};

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (title !== undefined) { updates.push("title = ?"); values.push(title); }
  if (description !== undefined) { updates.push("description = ?"); values.push(description); }
  if (privacy !== undefined) {
    if (!["public", "group", "private"].includes(privacy)) return c.json({ error: "Invalid privacy" }, 400);
    updates.push("privacy = ?");
    values.push(privacy);
  }
  if (group_id !== undefined) { updates.push("group_id = ?"); values.push(group_id); }

  if (content !== undefined || language !== undefined) {
    const newContent = content ?? doc.content;
    const newLang = language ?? doc.language;
    const html = await highlightCode(newContent, newLang);
    if (content !== undefined) { updates.push("content = ?"); values.push(newContent); }
    if (language !== undefined) { updates.push("language = ?"); values.push(newLang); }
    updates.push("highlighted_html = ?");
    values.push(html);
  }

  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);
  updates.push("updated_at = unixepoch()");

  db.prepare(`UPDATE documents SET ${updates.join(", ")} WHERE slug = ?`).run(...values, slug);

  const updated = db.query<Document, [string]>("SELECT * FROM documents WHERE slug = ?").get(slug);
  return c.json({ doc: updated });
});

// DELETE /api/documents/:slug
app.delete("/:slug", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const doc = db.query<{ id: number; owner_id: number }, [string]>(
    "SELECT id, owner_id FROM documents WHERE slug = ?"
  ).get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);
  if (doc.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  db.prepare("DELETE FROM documents WHERE slug = ?").run(slug);
  return c.json({ ok: true });
});

// POST /api/documents/:slug/shares
app.post("/:slug/shares", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const doc = db.query<{ id: number; owner_id: number }, [string]>(
    "SELECT id, owner_id FROM documents WHERE slug = ?"
  ).get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);
  if (doc.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  const body = c.req.raw.body ? c.req.json() : Promise.resolve({});
  return body.then(async (b: any) => {
    const { handle_or_email } = b ?? {};
    if (!handle_or_email) return c.json({ error: "handle_or_email is required" }, 400);

    const target = db
      .query<{ id: number; handle: string; display_name: string | null }, [string, string]>(
        "SELECT id, handle, display_name FROM users WHERE handle = ? OR email = ? LIMIT 1"
      )
      .get(handle_or_email, handle_or_email);
    if (!target) return c.json({ error: "User not found" }, 404);
    if (target.id === me.id) return c.json({ error: "Cannot share with yourself" }, 400);

    db.prepare(
      "INSERT OR IGNORE INTO document_shares (doc_id, user_id, shared_by) VALUES (?, ?, ?)"
    ).run(doc.id, target.id, me.id);

    return c.json({ shared_with: target });
  });
});

// GET /api/documents/:slug/shares
app.get("/:slug/shares", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const doc = db.query<{ id: number; owner_id: number }, [string]>(
    "SELECT id, owner_id FROM documents WHERE slug = ?"
  ).get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);
  if (doc.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  const shares = db
    .query<
      { id: number; handle: string; display_name: string | null; shared_at: number },
      [number]
    >(
      `SELECT u.id, u.handle, u.display_name, ds.created_at as shared_at
       FROM document_shares ds JOIN users u ON ds.user_id = u.id
       WHERE ds.doc_id = ?`
    )
    .all(doc.id);

  return c.json({ shares });
});

// DELETE /api/documents/:slug/shares/:userId
app.delete("/:slug/shares/:userId", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug, userId } = c.req.param();

  const doc = db.query<{ id: number; owner_id: number }, [string]>(
    "SELECT id, owner_id FROM documents WHERE slug = ?"
  ).get(slug);
  if (!doc) return c.json({ error: "Not found" }, 404);
  if (doc.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  db.prepare("DELETE FROM document_shares WHERE doc_id = ? AND user_id = ?").run(doc.id, Number(userId));
  return c.json({ ok: true });
});

export default app;
