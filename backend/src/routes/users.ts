import { Hono } from "hono";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { hashPassword, verifyPassword } from "../lib/password";
import type { Variables, AuthUser } from "../types";

const app = new Hono<{ Variables: Variables & { user: AuthUser | null } }>();

const getByHandle = db.query<AuthUser, [string]>(
  "SELECT id, handle, email, display_name, bio, avatar_url, created_at FROM users WHERE handle = ?"
);

const getPublicDocs = db.query<
  { slug: string; title: string; language: string; description: string | null; created_at: number },
  [number]
>(
  "SELECT slug, title, language, description, created_at FROM documents WHERE owner_id = ? AND privacy = 'public' ORDER BY created_at DESC LIMIT 50"
);

// GET /api/users/:handle
app.get("/:handle", optionalAuth, (c) => {
  const { handle } = c.req.param();
  const user = getByHandle.get(handle);
  if (!user) return c.json({ error: "User not found" }, 404);

  const me = c.var.user;
  const isSelf = me?.id === user.id;

  let docs;
  if (isSelf) {
    docs = db
      .query<
        { slug: string; title: string; language: string; privacy: string; description: string | null; created_at: number },
        [number]
      >(
        "SELECT slug, title, language, privacy, description, created_at FROM documents WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50"
      )
      .all(user.id);
  } else {
    docs = getPublicDocs.all(user.id);
  }

  // Don't expose email to others
  const profile = isSelf
    ? user
    : { id: user.id, handle: user.handle, display_name: user.display_name, bio: user.bio, avatar_url: user.avatar_url, created_at: user.created_at };

  return c.json({ user: profile, docs });
});

// PATCH /api/users/me
app.patch("/me", requireAuth, async (c) => {
  const me = c.var.user;
  const body = await c.req.json();
  const { display_name, bio, avatar_url, current_password, new_password } = body ?? {};

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (display_name !== undefined) { updates.push("display_name = ?"); values.push(display_name); }
  if (bio !== undefined) { updates.push("bio = ?"); values.push(bio); }
  if (avatar_url !== undefined) { updates.push("avatar_url = ?"); values.push(avatar_url); }

  if (new_password) {
    if (!current_password) return c.json({ error: "current_password required to change password" }, 400);
    if (new_password.length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);
    const row = db.query<{ password_hash: string }, [number]>(
      "SELECT password_hash FROM users WHERE id = ?"
    ).get(me.id);
    const valid = await verifyPassword(current_password, row!.password_hash);
    if (!valid) return c.json({ error: "Current password is incorrect" }, 400);
    const hash = await hashPassword(new_password);
    updates.push("password_hash = ?");
    values.push(hash);
  }

  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);

  updates.push("updated_at = unixepoch()");
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values, me.id);

  const updated = db.query<AuthUser, [number]>(
    "SELECT id, handle, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?"
  ).get(me.id);

  return c.json({ user: updated });
});

// GET /api/users/resolve?q=handle_or_email
app.get("/resolve", requireAuth, (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "q is required" }, 400);

  const user = db
    .query<
      { id: number; handle: string; display_name: string | null; avatar_url: string | null },
      [string, string]
    >(
      "SELECT id, handle, display_name, avatar_url FROM users WHERE handle = ? OR email = ? LIMIT 1"
    )
    .get(q, q);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
});

export default app;
