import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyJWT } from "../lib/jwt";
import { db } from "../db/client";
import type { Variables, AuthUser } from "../types";

const getUser = db.query<AuthUser, [number]>(
  "SELECT id, handle, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?"
);

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const token = getCookie(c, "token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const payload = await verifyJWT(token);
    const user = getUser.get(Number(payload.sub));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
