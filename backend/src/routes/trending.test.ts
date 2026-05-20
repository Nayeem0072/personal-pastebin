import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";

function buildDb() {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(`
    CREATE TABLE users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      handle       TEXT NOT NULL UNIQUE,
      email        TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE groups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slug       TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'public',
      owner_id   INTEGER NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE group_members (
      group_id  INTEGER NOT NULL REFERENCES groups(id),
      user_id   INTEGER NOT NULL REFERENCES users(id),
      role      TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (group_id, user_id)
    );
    CREATE TABLE documents (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      slug             TEXT NOT NULL UNIQUE,
      title            TEXT NOT NULL DEFAULT 'Untitled',
      content          TEXT NOT NULL,
      language         TEXT NOT NULL DEFAULT 'plaintext',
      highlighted_html TEXT,
      privacy          TEXT NOT NULL DEFAULT 'public',
      group_id         INTEGER REFERENCES groups(id),
      owner_id         INTEGER NOT NULL REFERENCES users(id),
      view_count       INTEGER NOT NULL DEFAULT 0,
      created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE document_views (
      doc_id    INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX idx_doc_views_doc  ON document_views(doc_id);
    CREATE INDEX idx_doc_views_time ON document_views(viewed_at DESC);
  `);
  return db;
}

function insertUser(db: Database, handle: string): number {
  db.prepare("INSERT INTO users (handle, email, password_hash) VALUES (?, ?, 'x')").run(handle, `${handle}@test.com`);
  return (db.query<{ id: number }, [string]>("SELECT id FROM users WHERE handle = ?").get(handle))!.id;
}

function insertDoc(db: Database, slug: string, ownerId: number, privacy = "public"): number {
  db.prepare(
    "INSERT INTO documents (slug, title, content, owner_id, privacy) VALUES (?, ?, 'x', ?, ?)"
  ).run(slug, slug, ownerId, privacy);
  return (db.query<{ id: number }, [string]>("SELECT id FROM documents WHERE slug = ?").get(slug))!.id;
}

function recordView(db: Database, docId: number, viewedAt?: number) {
  if (viewedAt !== undefined) {
    db.prepare("INSERT INTO document_views (doc_id, viewed_at) VALUES (?, ?)").run(docId, viewedAt);
  } else {
    db.prepare("INSERT INTO document_views (doc_id) VALUES (?)").run(docId);
  }
  db.prepare("UPDATE documents SET view_count = view_count + 1 WHERE id = ?").run(docId);
}

function getTrending(db: Database, limit = 20, days = 7): any[] {
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const weekly = db.query<any, [number, number]>(`
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

  if (weekly.length >= limit) return weekly;

  const seen = weekly.map((r: any) => r.slug);
  const remaining = limit - weekly.length;
  const placeholders = seen.length > 0 ? seen.map(() => "?").join(",") : "''";

  const fallback = db.query<any, (string | number)[]>(`
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

  return [...weekly, ...fallback];
}

describe("trending", () => {
  let db: Database;
  let userId: number;

  beforeEach(() => {
    db = buildDb();
    userId = insertUser(db, "alice");
  });

  it("returns public pastes ordered by weekly view count", () => {
    const aId = insertDoc(db, "slug-a", userId);
    const bId = insertDoc(db, "slug-b", userId);
    const cId = insertDoc(db, "slug-c", userId);

    recordView(db, bId);
    recordView(db, bId);
    recordView(db, bId);
    recordView(db, aId);
    recordView(db, aId);
    recordView(db, cId);

    const results = getTrending(db);
    expect(results[0].slug).toBe("slug-b");
    expect(results[0].weekly_views).toBe(3);
    expect(results[1].slug).toBe("slug-a");
    expect(results[1].weekly_views).toBe(2);
    expect(results[2].slug).toBe("slug-c");
    expect(results[2].weekly_views).toBe(1);
  });

  it("excludes non-public pastes from trending results", () => {
    const pubId = insertDoc(db, "pub", userId, "public");
    const privId = insertDoc(db, "priv", userId, "private");
    const grpId = insertDoc(db, "grp", userId, "group");

    recordView(db, privId);
    recordView(db, privId);
    recordView(db, grpId);
    recordView(db, pubId);

    const results = getTrending(db);
    expect(results.every((r: any) => r.privacy === "public")).toBe(true);
    expect(results.some((r: any) => r.slug === "priv")).toBe(false);
    expect(results.some((r: any) => r.slug === "grp")).toBe(false);
    expect(results.some((r: any) => r.slug === "pub")).toBe(true);
  });

  it("views older than the window do not count toward weekly rank", () => {
    const aId = insertDoc(db, "old-views", userId);
    const bId = insertDoc(db, "new-views", userId);
    const now = Math.floor(Date.now() / 1000);

    // old-views has 10 views but all 8 days ago
    for (let i = 0; i < 10; i++) {
      recordView(db, aId, now - 8 * 86400);
    }
    // new-views has 1 view right now
    recordView(db, bId, now);

    const results = getTrending(db, 20, 7);
    // weekly trending: only new-views qualifies
    const weekly = results.filter((r: any) => r.weekly_views > 0);
    expect(weekly.length).toBe(1);
    expect(weekly[0].slug).toBe("new-views");
  });

  it("falls back to all-time view count when no weekly views exist", () => {
    const aId = insertDoc(db, "popular", userId);
    const bId = insertDoc(db, "unpopular", userId);
    const now = Math.floor(Date.now() / 1000);

    // Both have old views (outside 7-day window)
    for (let i = 0; i < 5; i++) recordView(db, aId, now - 10 * 86400);
    recordView(db, bId, now - 10 * 86400);

    const results = getTrending(db, 20, 7);
    // No weekly_views for either, but all-time fallback orders by view_count
    expect(results.every((r: any) => r.weekly_views === 0)).toBe(true);
    expect(results[0].slug).toBe("popular");
    expect(results[0].view_count).toBe(5);
    expect(results[1].slug).toBe("unpopular");
  });

  it("increments view_count on the document when a view is recorded", () => {
    const docId = insertDoc(db, "counted", userId);
    const before = (db.query<{ view_count: number }, [string]>(
      "SELECT view_count FROM documents WHERE slug = ?"
    ).get("counted"))!.view_count;
    expect(before).toBe(0);

    recordView(db, docId);
    recordView(db, docId);

    const after = (db.query<{ view_count: number }, [string]>(
      "SELECT view_count FROM documents WHERE slug = ?"
    ).get("counted"))!.view_count;
    expect(after).toBe(2);
  });

  it("returns empty results when there are no public pastes", () => {
    const results = getTrending(db);
    expect(results).toEqual([]);
  });
});
