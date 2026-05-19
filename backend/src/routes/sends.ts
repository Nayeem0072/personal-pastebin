import { Hono } from "hono";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";
import { canViewDoc } from "../lib/docAccess";
import type { Variables, AuthUser, Document } from "../types/index";

const app = new Hono<{ Variables: Variables }>();

// POST /api/sends — send a doc to a user
app.post("/", requireAuth, async (c) => {
  const me = c.var.user;
  const body = await c.req.json();
  const { doc_slug, handle_or_email, message } = body ?? {};

  if (!doc_slug) return c.json({ error: "doc_slug is required" }, 400);
  if (!handle_or_email) return c.json({ error: "handle_or_email is required" }, 400);

  const doc = db.query<Document, [string]>("SELECT * FROM documents WHERE slug = ?").get(doc_slug);
  if (!doc) return c.json({ error: "Document not found" }, 404);

  if (!canViewDoc(doc, me.id)) return c.json({ error: "Forbidden" }, 403);
  if (doc.privacy === "private") return c.json({ error: "Cannot send a private document" }, 400);

  const recipient = db
    .query<{ id: number; handle: string; display_name: string | null }, [string, string]>(
      "SELECT id, handle, display_name FROM users WHERE handle = ? OR email = ? LIMIT 1"
    )
    .get(handle_or_email, handle_or_email);
  if (!recipient) return c.json({ error: "User not found" }, 404);
  if (recipient.id === me.id) return c.json({ error: "Cannot send to yourself" }, 400);

  if (doc.privacy === "group" && doc.group_id) {
    const member = db
      .query<{ user_id: number }, [number, number]>(
        "SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?"
      )
      .get(doc.group_id, recipient.id);
    if (!member) {
      return c.json({ error: "Recipient is not a member of this document's group" }, 403);
    }
  }

  const result = db
    .prepare(
      "INSERT OR IGNORE INTO document_sends (doc_id, sender_id, recipient_id, message) VALUES (?, ?, ?, ?)"
    )
    .run(doc.id, me.id, recipient.id, message ?? null);

  const id = Number(result.lastInsertRowid);
  return c.json({ id, sent_to: { handle: recipient.handle, display_name: recipient.display_name } }, 201);
});

// GET /api/sends/inbox — paginated list of docs sent to me
app.get("/inbox", requireAuth, (c) => {
  const me = c.var.user;
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const offset = (page - 1) * limit;
  const q = c.req.query("q") ?? null;

  const filter = q ? `%${q}%` : null;

  const sends = db
    .query<
      {
        send_id: number;
        message: string | null;
        read_at: number | null;
        sent_at: number;
        slug: string;
        title: string;
        language: string;
        privacy: string;
        description: string | null;
        sender_handle: string;
        sender_display_name: string | null;
      },
      [number, string | null, string | null, string | null, string | null, number, number]
    >(
      `SELECT
         ds.id        AS send_id,
         ds.message,
         ds.read_at,
         ds.created_at AS sent_at,
         d.slug,
         d.title,
         d.language,
         d.privacy,
         d.description,
         u.handle     AS sender_handle,
         u.display_name AS sender_display_name
       FROM document_sends ds
       JOIN documents d ON ds.doc_id    = d.id
       JOIN users u     ON ds.sender_id = u.id
       WHERE ds.recipient_id = ?
         AND (? IS NULL OR d.title LIKE ? OR u.handle LIKE ?)
       ORDER BY ds.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(me.id, filter, filter, filter, limit, offset);

  const total = (
    db
      .query<{ cnt: number }, [number, string | null, string | null, string | null]>(
        `SELECT COUNT(*) AS cnt
         FROM document_sends ds
         JOIN documents d ON ds.doc_id    = d.id
         JOIN users u     ON ds.sender_id = u.id
         WHERE ds.recipient_id = ?
           AND (? IS NULL OR d.title LIKE ? OR u.handle LIKE ?)`
      )
      .get(me.id, filter, filter, filter)
  )!.cnt;

  return c.json({ sends, page, limit, total, has_more: offset + sends.length < total });
});

// GET /api/sends/notifications — recent notifications for bell dropdown (doc sends + group invites)
app.get("/notifications", requireAuth, (c) => {
  const me = c.var.user;

  type NotificationRow = {
    id: number;
    type: "document_send" | "group_invite";
    read_at: number | null;
    created_at: number;
    message: string | null;
    doc_slug: string | null;
    doc_title: string | null;
    doc_language: string | null;
    sender_handle: string | null;
    group_slug: string | null;
    group_name: string | null;
    inviter_handle: string | null;
  };

  // Split into two queries to work around bun:sqlite's ? binding limitation across UNION ALL
  const docSends = db
    .query<NotificationRow, [number]>(
      `SELECT
         ds.id              AS id,
         'document_send'    AS type,
         ds.read_at,
         ds.created_at,
         ds.message,
         d.slug             AS doc_slug,
         d.title            AS doc_title,
         d.language         AS doc_language,
         u.handle           AS sender_handle,
         NULL               AS group_slug,
         NULL               AS group_name,
         NULL               AS inviter_handle
       FROM document_sends ds
       JOIN documents d ON ds.doc_id    = d.id
       JOIN users u     ON ds.sender_id = u.id
       WHERE ds.recipient_id = ?`
    )
    .all(me.id);

  const groupInvites = db
    .query<NotificationRow, [number]>(
      `SELECT
         gi.id              AS id,
         'group_invite'     AS type,
         gi.read_at,
         gi.created_at,
         gi.message,
         NULL               AS doc_slug,
         NULL               AS doc_title,
         NULL               AS doc_language,
         NULL               AS sender_handle,
         g.slug             AS group_slug,
         g.name             AS group_name,
         u.handle           AS inviter_handle
       FROM group_handle_invites gi
       JOIN groups g ON gi.group_id  = g.id
       JOIN users u  ON gi.inviter_id = u.id
       WHERE gi.invitee_id = ? AND gi.status = 'pending'`
    )
    .all(me.id);

  const notifications = [...docSends, ...groupInvites]
    .sort((a, b) => {
      if (a.read_at === null && b.read_at !== null) return -1;
      if (a.read_at !== null && b.read_at === null) return 1;
      return b.created_at - a.created_at;
    })
    .slice(0, 25);

  return c.json({ notifications });
});

// GET /api/sends/unread-count
app.get("/unread-count", requireAuth, (c) => {
  const me = c.var.user;
  const { cnt } = db
    .query<{ cnt: number }, [number, number]>(
      `SELECT (
         SELECT COUNT(*) FROM document_sends WHERE recipient_id = ? AND read_at IS NULL
       ) + (
         SELECT COUNT(*) FROM group_handle_invites WHERE invitee_id = ? AND status = 'pending' AND read_at IS NULL
       ) AS cnt`
    )
    .get(me.id, me.id)!;
  return c.json({ count: cnt });
});

// PATCH /api/sends/read-all — mark all as read (doc sends + group invites)
app.patch("/read-all", requireAuth, (c) => {
  const me = c.var.user;
  const result = db
    .prepare("UPDATE document_sends SET read_at = unixepoch() WHERE recipient_id = ? AND read_at IS NULL")
    .run(me.id);
  db.prepare(
    "UPDATE group_handle_invites SET read_at = unixepoch() WHERE invitee_id = ? AND status = 'pending' AND read_at IS NULL"
  ).run(me.id);
  return c.json({ ok: true, updated: result.changes });
});

// PATCH /api/sends/:sendId/read — mark one as read
app.patch("/:sendId/read", requireAuth, (c) => {
  const me = c.var.user;
  const sendId = Number(c.req.param("sendId"));
  db.prepare(
    "UPDATE document_sends SET read_at = unixepoch() WHERE id = ? AND recipient_id = ? AND read_at IS NULL"
  ).run(sendId, me.id);
  return c.json({ ok: true });
});

export default app;
