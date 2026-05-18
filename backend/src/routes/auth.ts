import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { db } from "../db/client";
import { hashPassword, verifyPassword } from "../lib/password";
import { signJWT } from "../lib/jwt";
import { checkRateLimit } from "../lib/rateLimit";
import { requireAuth } from "../middleware/auth";
import type { Variables, AuthUser } from "../types";

const app = new Hono<{ Variables: Variables }>();

const isProduction = process.env.NODE_ENV === "production";

function setCookieToken(c: any, token: string) {
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

const findByEmailOrHandle = db.query<
  { id: number },
  [string, string]
>("SELECT id FROM users WHERE email = ? OR handle = ? LIMIT 1");

const findByEmail = db.query<
  { id: number; password_hash: string; handle: string },
  [string]
>("SELECT id, password_hash, handle FROM users WHERE email = ? LIMIT 1");

const insertUser = db.prepare(
  "INSERT INTO users (handle, email, password_hash, display_name) VALUES (?, ?, ?, ?)"
);

const getFullUser = db.query<AuthUser, [number]>(
  "SELECT id, handle, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?"
);

// POST /api/auth/signup
app.post("/signup", async (c) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  if (isProduction && checkRateLimit(`signup:${ip}`, 3600, 10)) {
    return c.json({ error: "Too many signup attempts. Try again later." }, 429);
  }

  const body = await c.req.json();
  const { email, password, handle, display_name } = body ?? {};

  if (!email || !password || !handle) {
    return c.json({ error: "email, password, and handle are required" }, 400);
  }
  if (!/^[a-z0-9-]{3,32}$/.test(handle)) {
    return c.json({ error: "Handle must be 3-32 chars, lowercase letters, numbers, hyphens only" }, 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "Invalid email address" }, 400);
  }

  if (findByEmailOrHandle.get(email, handle)) {
    return c.json({ error: "Email or handle already taken" }, 409);
  }

  const password_hash = await hashPassword(password);
  const result = insertUser.run(handle, email, password_hash, display_name ?? null);
  const userId = result.lastInsertRowid as number;

  const user = getFullUser.get(userId)!;
  const token = await signJWT({ sub: String(userId), handle });
  setCookieToken(c, token);

  return c.json({ user, token }, 201);
});

// POST /api/auth/login
app.post("/login", async (c) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";

  const body = await c.req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  if (checkRateLimit(`login:${email}`, 900, 10)) {
    return c.json({ error: "Too many login attempts. Try again in 15 minutes." }, 429);
  }

  const row = findByEmail.get(email);
  if (!row) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const user = getFullUser.get(row.id)!;
  const token = await signJWT({ sub: String(row.id), handle: row.handle });
  setCookieToken(c, token);

  return c.json({ user, token });
});

// POST /api/auth/logout
app.post("/logout", requireAuth, (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ ok: true });
});

// GET /api/auth/me
app.get("/me", requireAuth, (c) => {
  return c.json({ user: c.var.user });
});

// GET /api/auth/check-handle — real-time handle availability
app.get("/check-handle", async (c) => {
  const handle = c.req.query("handle");
  if (!handle) return c.json({ error: "handle required" }, 400);
  const taken = !!db.query("SELECT id FROM users WHERE handle = ? LIMIT 1").get(handle);
  return c.json({ available: !taken });
});

export default app;
