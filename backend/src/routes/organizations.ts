import { Hono } from "hono";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { generateInviteCode, isInviteExpired, isInviteExhausted } from "../lib/inviteCode";
import type { Variables, AuthUser, Org, OrgMember } from "../types";

type Vars = Variables & { user: AuthUser | null };
const app = new Hono<{ Variables: Vars }>();

function getMemberRole(orgId: number, userId: number): OrgMember["role"] | null {
  const row = db
    .query<{ role: OrgMember["role"] }, [number, number]>(
      "SELECT role FROM org_members WHERE org_id = ? AND user_id = ?"
    )
    .get(orgId, userId);
  return row?.role ?? null;
}

function isAdminOrAbove(role: string | null) {
  return role === "owner" || role === "admin";
}

// POST /api/orgs
app.post("/", requireAuth, (c) => {
  const me = c.var.user!;
  const body = c.req.json();
  return body.then((b: any) => {
    const { slug, name, description, visibility = "public" } = b ?? {};
    if (!slug || !name) return c.json({ error: "slug and name are required" }, 400);
    if (!/^[a-z0-9-]{2,64}$/.test(slug)) return c.json({ error: "Invalid org slug" }, 400);
    if (!["public", "private"].includes(visibility)) return c.json({ error: "Invalid visibility" }, 400);

    const existing = db.query("SELECT id FROM organizations WHERE slug = ?").get(slug);
    if (existing) return c.json({ error: "Org slug already taken" }, 409);

    const result = db.prepare(
      "INSERT INTO organizations (slug, name, description, visibility, owner_id) VALUES (?, ?, ?, ?, ?)"
    ).run(slug, name, description ?? null, visibility, me.id);

    const orgId = result.lastInsertRowid as number;
    db.prepare("INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, 'owner')").run(orgId, me.id);

    const org = db.query<Org, [number]>("SELECT * FROM organizations WHERE id = ?").get(orgId);
    return c.json({ org }, 201);
  });
});

// GET /api/orgs — list user's orgs
app.get("/", requireAuth, (c) => {
  const me = c.var.user!;
  const orgs = db
    .query<Org & { role: string }, [number]>(
      `SELECT o.*, om.role FROM organizations o
       JOIN org_members om ON o.id = om.org_id
       WHERE om.user_id = ?
       ORDER BY o.name`
    )
    .all(me.id);
  return c.json({ orgs });
});

// GET /api/orgs/search?q=
app.get("/search", optionalAuth, (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const me = c.var.user;
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  let orgs;
  if (q) {
    const pattern = `%${q}%`;
    orgs = db
      .query<Org, [string, string, number]>(
        "SELECT * FROM organizations WHERE visibility = 'public' AND (name LIKE ? OR slug LIKE ?) ORDER BY name LIMIT ?"
      )
      .all(pattern, pattern, limit);
  } else {
    orgs = db
      .query<Org, [number]>(
        "SELECT * FROM organizations WHERE visibility = 'public' ORDER BY created_at DESC LIMIT ?"
      )
      .all(limit);
  }
  return c.json({ orgs });
});

// GET /api/orgs/join/:code — preview invite
app.get("/join/:code", optionalAuth, (c) => {
  const { code } = c.req.param();
  const invite = db
    .query<
      { id: number; org_id: number; max_uses: number | null; use_count: number; expires_at: number | null },
      [string]
    >(
      "SELECT id, org_id, max_uses, use_count, expires_at FROM org_invites WHERE code = ?"
    )
    .get(code);

  if (!invite) return c.json({ error: "Invalid invite code" }, 404);
  if (isInviteExpired(invite.expires_at)) return c.json({ error: "This invite has expired" }, 410);
  if (isInviteExhausted(invite.use_count, invite.max_uses)) return c.json({ error: "This invite has reached its limit" }, 410);

  const org = db.query<Org, [number]>("SELECT * FROM organizations WHERE id = ?").get(invite.org_id);
  return c.json({ org, invite: { expires_at: invite.expires_at, max_uses: invite.max_uses, use_count: invite.use_count } });
});

// POST /api/orgs/join/:code — join via invite
app.post("/join/:code", requireAuth, (c) => {
  const me = c.var.user!;
  const { code } = c.req.param();

  const invite = db
    .query<
      { id: number; org_id: number; max_uses: number | null; use_count: number; expires_at: number | null },
      [string]
    >(
      "SELECT id, org_id, max_uses, use_count, expires_at FROM org_invites WHERE code = ?"
    )
    .get(code);

  if (!invite) return c.json({ error: "Invalid invite code" }, 404);
  if (isInviteExpired(invite.expires_at)) return c.json({ error: "This invite has expired" }, 410);
  if (isInviteExhausted(invite.use_count, invite.max_uses)) return c.json({ error: "This invite has reached its limit" }, 410);

  // Check already a member
  const existing = db
    .query<{ user_id: number }, [number, number]>(
      "SELECT user_id FROM org_members WHERE org_id = ? AND user_id = ?"
    )
    .get(invite.org_id, me.id);
  if (existing) {
    const org = db.query<Org, [number]>("SELECT * FROM organizations WHERE id = ?").get(invite.org_id);
    return c.json({ org, already_member: true });
  }

  // Transactional join
  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, 'member')").run(invite.org_id, me.id);
    db.prepare("UPDATE org_invites SET use_count = use_count + 1 WHERE id = ?").run(invite.id);
  })();

  const org = db.query<Org, [number]>("SELECT * FROM organizations WHERE id = ?").get(invite.org_id);
  return c.json({ org });
});

// GET /api/orgs/:slug
app.get("/:slug", optionalAuth, (c) => {
  const { slug } = c.req.param();
  const me = c.var.user;

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = me ? getMemberRole(org.id, me.id) : null;
  if (org.visibility === "private" && !role) return c.json({ error: "Not found" }, 404);

  const memberCount = (db.query<{ cnt: number }, [number]>(
    "SELECT COUNT(*) as cnt FROM org_members WHERE org_id = ?"
  ).get(org.id))!.cnt;

  return c.json({ org, role, member_count: memberCount });
});

// PATCH /api/orgs/:slug
app.patch("/:slug", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  const body = c.req.json();
  return body.then((b: any) => {
    const { name, description, visibility } = b ?? {};
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (visibility !== undefined) {
      if (!["public", "private"].includes(visibility)) return c.json({ error: "Invalid visibility" }, 400);
      updates.push("visibility = ?");
      values.push(visibility);
    }
    if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);
    updates.push("updated_at = unixepoch()");

    db.prepare(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`).run(...values, org.id);
    const updated = db.query<Org, [number]>("SELECT * FROM organizations WHERE id = ?").get(org.id);
    return c.json({ org: updated });
  });
});

// DELETE /api/orgs/:slug
app.delete("/:slug", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);
  if (org.owner_id !== me.id) return c.json({ error: "Forbidden" }, 403);

  db.prepare("DELETE FROM organizations WHERE id = ?").run(org.id);
  return c.json({ ok: true });
});

// GET /api/orgs/:slug/members
app.get("/:slug/members", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!role) return c.json({ error: "Forbidden" }, 403);

  const members = db
    .query<
      { id: number; handle: string; display_name: string | null; avatar_url: string | null; role: string; joined_at: number },
      [number]
    >(
      `SELECT u.id, u.handle, u.display_name, u.avatar_url, om.role, om.joined_at
       FROM org_members om JOIN users u ON om.user_id = u.id
       WHERE om.org_id = ?
       ORDER BY CASE om.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.handle`
    )
    .all(org.id);

  return c.json({ members, my_role: role });
});

// PATCH /api/orgs/:slug/members/:userId
app.patch("/:slug/members/:userId", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug, userId } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const myRole = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(myRole)) return c.json({ error: "Forbidden" }, 403);

  const body = c.req.json();
  return body.then((b: any) => {
    const { role } = b ?? {};
    if (!["admin", "member"].includes(role)) return c.json({ error: "role must be admin or member" }, 400);

    const targetRole = getMemberRole(org.id, Number(userId));
    if (!targetRole) return c.json({ error: "User is not a member" }, 404);
    if (targetRole === "owner") return c.json({ error: "Cannot change owner's role" }, 403);

    db.prepare("UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?").run(role, org.id, Number(userId));
    return c.json({ ok: true });
  });
});

// DELETE /api/orgs/:slug/members/:userId
app.delete("/:slug/members/:userId", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug, userId } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const myRole = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(myRole)) return c.json({ error: "Forbidden" }, 403);

  const targetRole = getMemberRole(org.id, Number(userId));
  if (!targetRole) return c.json({ error: "User is not a member" }, 404);
  if (targetRole === "owner") return c.json({ error: "Cannot remove the owner" }, 403);

  db.prepare("DELETE FROM org_members WHERE org_id = ? AND user_id = ?").run(org.id, Number(userId));
  return c.json({ ok: true });
});

// POST /api/orgs/:slug/leave
app.post("/:slug/leave", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!role) return c.json({ error: "You are not a member" }, 400);
  if (role === "owner") return c.json({ error: "Transfer ownership before leaving" }, 400);

  db.prepare("DELETE FROM org_members WHERE org_id = ? AND user_id = ?").run(org.id, me.id);
  return c.json({ ok: true });
});

// POST /api/orgs/:slug/invites
app.post("/:slug/invites", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  const body = c.req.json();
  return body.then((b: any) => {
    const { max_uses, expires_at } = b ?? {};
    const code = generateInviteCode();

    db.prepare(
      "INSERT INTO org_invites (org_id, code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)"
    ).run(org.id, code, me.id, max_uses ?? null, expires_at ?? null);

    return c.json({ code, max_uses: max_uses ?? null, expires_at: expires_at ?? null }, 201);
  });
});

// GET /api/orgs/:slug/invites
app.get("/:slug/invites", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  const invites = db
    .query<
      { id: number; code: string; max_uses: number | null; use_count: number; expires_at: number | null; created_at: number; created_by_handle: string },
      [number]
    >(
      `SELECT i.id, i.code, i.max_uses, i.use_count, i.expires_at, i.created_at, u.handle as created_by_handle
       FROM org_invites i JOIN users u ON i.created_by = u.id
       WHERE i.org_id = ?
       ORDER BY i.created_at DESC`
    )
    .all(org.id);

  return c.json({ invites });
});

// DELETE /api/orgs/:slug/invites/:code
app.delete("/:slug/invites/:code", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug, code } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  db.prepare("DELETE FROM org_invites WHERE code = ? AND org_id = ?").run(code, org.id);
  return c.json({ ok: true });
});

// POST /api/orgs/:slug/requests
app.post("/:slug/requests", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  if (org.visibility === "private") return c.json({ error: "This organization is private" }, 403);

  const role = getMemberRole(org.id, me.id);
  if (role) return c.json({ error: "You are already a member" }, 400);

  const body = c.req.json();
  return body.then((b: any) => {
    const { message } = b ?? {};
    try {
      db.prepare(
        "INSERT INTO org_join_requests (org_id, user_id, message) VALUES (?, ?, ?)"
      ).run(org.id, me.id, message ?? null);
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) {
        return c.json({ error: "You already have a pending request" }, 409);
      }
      throw e;
    }
    return c.json({ ok: true }, 201);
  });
});

// GET /api/orgs/:slug/requests
app.get("/:slug/requests", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  const status = c.req.query("status") ?? "pending";
  const requests = db
    .query<
      { id: number; message: string | null; status: string; created_at: number; handle: string; display_name: string | null; avatar_url: string | null },
      [number, string]
    >(
      `SELECT r.id, r.message, r.status, r.created_at, u.handle, u.display_name, u.avatar_url
       FROM org_join_requests r JOIN users u ON r.user_id = u.id
       WHERE r.org_id = ? AND r.status = ?
       ORDER BY r.created_at`
    )
    .all(org.id, status);

  return c.json({ requests });
});

// PATCH /api/orgs/:slug/requests/:requestId
app.patch("/:slug/requests/:requestId", requireAuth, (c) => {
  const me = c.var.user!;
  const { slug, requestId } = c.req.param();

  const org = db.query<Org, [string]>("SELECT * FROM organizations WHERE slug = ?").get(slug);
  if (!org) return c.json({ error: "Not found" }, 404);

  const role = getMemberRole(org.id, me.id);
  if (!isAdminOrAbove(role)) return c.json({ error: "Forbidden" }, 403);

  const body = c.req.json();
  return body.then((b: any) => {
    const { action } = b ?? {};
    if (!["approve", "reject"].includes(action)) return c.json({ error: "action must be approve or reject" }, 400);

    const request = db
      .query<{ id: number; user_id: number; status: string }, [number, number]>(
        "SELECT id, user_id, status FROM org_join_requests WHERE id = ? AND org_id = ?"
      )
      .get(Number(requestId), org.id);
    if (!request) return c.json({ error: "Request not found" }, 404);
    if (request.status !== "pending") return c.json({ error: "Request is no longer pending" }, 400);

    db.transaction(() => {
      const newStatus = action === "approve" ? "approved" : "rejected";
      db.prepare(
        "UPDATE org_join_requests SET status = ?, reviewed_by = ?, updated_at = unixepoch() WHERE id = ?"
      ).run(newStatus, me.id, request.id);

      if (action === "approve") {
        db.prepare(
          "INSERT OR IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, 'member')"
        ).run(org.id, request.user_id);
      }
    })();

    return c.json({ ok: true });
  });
});

export default app;
