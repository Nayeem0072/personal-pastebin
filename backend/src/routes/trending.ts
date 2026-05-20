import { Hono } from "hono";
import { db } from "../db/client";
import { optionalAuth } from "../middleware/optionalAuth";
import type { AuthUser } from "../types";

const app = new Hono<{ Variables: { user: AuthUser | null } }>();

// GET /api/trending?limit=20&days=7
app.get("/", optionalAuth, (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const days = Math.min(Number(c.req.query("days") ?? 7), 30);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const weekly = db.query<{
    slug: string; title: string; language: string; privacy: string;
    created_at: number; view_count: number;
    owner_handle: string; owner_display_name: string | null;
    weekly_views: number;
  }, [number, number]>(`
    SELECT d.slug, d.title, d.language, d.privacy, d.created_at, d.view_count,
           u.handle AS owner_handle, u.display_name AS owner_display_name,
           COUNT(dv.doc_id) AS weekly_views
    FROM document_views dv
    JOIN documents d ON d.id = dv.doc_id
    JOIN users u ON d.owner_id = u.id
    WHERE dv.viewed_at >= ? AND d.privacy = 'public'
    GROUP BY d.id
    ORDER BY weekly_views DESC
    LIMIT ?
  `).all(since, limit);

  if (weekly.length >= limit) {
    return c.json({ results: weekly, window_days: days });
  }

  // Pad with all-time most-viewed public pastes not already included
  const seen = weekly.map((r) => r.slug);
  const remaining = limit - weekly.length;

  const placeholders = seen.length > 0 ? seen.map(() => "?").join(",") : "''";
  const fallback = db.query<{
    slug: string; title: string; language: string; privacy: string;
    created_at: number; view_count: number;
    owner_handle: string; owner_display_name: string | null;
    weekly_views: number;
  }, (string | number)[]>(`
    SELECT d.slug, d.title, d.language, d.privacy, d.created_at, d.view_count,
           u.handle AS owner_handle, u.display_name AS owner_display_name,
           0 AS weekly_views
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    WHERE d.privacy = 'public'
      AND d.slug NOT IN (${placeholders})
    ORDER BY d.view_count DESC, d.created_at DESC
    LIMIT ?
  `).all(...seen, remaining);

  return c.json({ results: [...weekly, ...fallback], window_days: days });
});

export default app;
