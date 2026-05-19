/**
 * Tests for /api/saved (saved pastes feature)
 */
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
      description      TEXT,
      highlighted_html TEXT,
      privacy          TEXT NOT NULL DEFAULT 'public',
      group_id         INTEGER REFERENCES groups(id),
      owner_id         INTEGER NOT NULL REFERENCES users(id),
      created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE document_shares (
      doc_id    INTEGER NOT NULL REFERENCES documents(id),
      user_id   INTEGER NOT NULL REFERENCES users(id),
      shared_by INTEGER NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (doc_id, user_id)
    );
    CREATE TABLE saved_pastes (
      user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      saved_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (user_id, doc_id)
    );
    CREATE INDEX IF NOT EXISTS idx_saved_pastes_user ON saved_pastes(user_id, saved_at DESC);
  `);
  return db;
}

// Mirrors the save route logic
function save(db: Database, userId: number, docSlug: string): { status: number; body: any } {
  const doc = db.query<any, [string]>("SELECT * FROM documents WHERE slug = ?").get(docSlug);
  if (!doc) return { status: 404, body: { error: "Not found" } };
  if (doc.owner_id === userId) return { status: 400, body: { error: "Cannot save your own paste" } };

  // canViewDoc inline
  const canView = (() => {
    if (doc.privacy === "public") return true;
    if (doc.privacy === "group" && doc.group_id) {
      return !!db.query<any, [number, number]>("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(doc.group_id, userId);
    }
    if (doc.privacy === "private") {
      return !!db.query<any, [number, number]>("SELECT 1 FROM document_shares WHERE doc_id = ? AND user_id = ?").get(doc.id, userId);
    }
    return false;
  })();
  if (!canView) return { status: 403, body: { error: "Forbidden" } };
  if (doc.privacy === "private") return { status: 400, body: { error: "Cannot save a private paste" } };

  const result = db.prepare("INSERT OR IGNORE INTO saved_pastes (user_id, doc_id) VALUES (?, ?)").run(userId, doc.id);
  if (result.changes === 0) return { status: 409, body: { error: "Already saved" } };
  return { status: 201, body: { ok: true } };
}

// Mirrors the list query with dynamic access filter
function listSaved(db: Database, userId: number): any[] {
  return db.query<any, [number, number, number]>(`
    SELECT d.slug, d.title, d.privacy, d.group_id
    FROM saved_pastes sp
    JOIN documents d ON sp.doc_id = d.id
    WHERE sp.user_id = ?
      AND (
        d.privacy = 'public'
        OR (d.privacy = 'group' AND d.group_id IS NOT NULL
            AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = d.group_id AND gm.user_id = ?))
        OR (d.privacy = 'private' AND EXISTS (SELECT 1 FROM document_shares ds2 WHERE ds2.doc_id = d.id AND ds2.user_id = ?))
      )
    ORDER BY sp.saved_at DESC
  `).all(userId, userId, userId);
}

function checkSaved(db: Database, userId: number, slug: string): boolean {
  const row = db.query<{ is_saved: number }, [string, number]>(`
    SELECT EXISTS(
      SELECT 1 FROM saved_pastes sp
      JOIN documents d ON sp.doc_id = d.id
      WHERE d.slug = ? AND sp.user_id = ?
    ) AS is_saved
  `).get(slug, userId)!;
  return row.is_saved === 1;
}

describe("saved pastes", () => {
  let db: Database;
  let aliceId: number;
  let bobId: number;
  let groupId: number;

  beforeEach(() => {
    db = buildDb();
    aliceId = Number(db.prepare("INSERT INTO users (handle,email,password_hash) VALUES (?,?,?)").run("alice", "alice@t.com", "x").lastInsertRowid);
    bobId   = Number(db.prepare("INSERT INTO users (handle,email,password_hash) VALUES (?,?,?)").run("bob",   "bob@t.com",   "x").lastInsertRowid);
    groupId = Number(db.prepare("INSERT INTO groups (slug,name,owner_id) VALUES (?,?,?)").run("eng", "Eng", aliceId).lastInsertRowid);
  });

  it("saves a public paste", () => {
    const docId = Number(db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-1","Pub","c","public",aliceId).lastInsertRowid);
    const res = save(db, bobId, "pub-1");
    expect(res.status).toBe(201);
    expect(db.query<any,[number,number]>("SELECT 1 FROM saved_pastes WHERE user_id=? AND doc_id=?").get(bobId, docId)).toBeTruthy();
  });

  it("cannot save own paste", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("my-1","My","c","public",aliceId);
    const res = save(db, aliceId, "my-1");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own/);
  });

  it("saves a group paste as a group member", () => {
    db.prepare("INSERT INTO group_members (group_id,user_id) VALUES (?,?)").run(groupId, bobId);
    db.prepare("INSERT INTO documents (slug,title,content,privacy,group_id,owner_id) VALUES (?,?,?,?,?,?)").run("grp-1","G","c","group",groupId,aliceId);
    const res = save(db, bobId, "grp-1");
    expect(res.status).toBe(201);
  });

  it("cannot save a group paste as a non-member", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,group_id,owner_id) VALUES (?,?,?,?,?,?)").run("grp-2","G","c","group",groupId,aliceId);
    const res = save(db, bobId, "grp-2");
    expect(res.status).toBe(403);
  });

  it("cannot save a private paste", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("priv-1","P","c","private",aliceId);
    // Even if shared, saving private pastes is blocked
    db.prepare("INSERT INTO document_shares (doc_id,user_id,shared_by) VALUES (?,?,?)").run(
      db.query<{id:number},[string]>("SELECT id FROM documents WHERE slug=?").get("priv-1")!.id,
      bobId, aliceId
    );
    const res = save(db, bobId, "priv-1");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/private/);
  });

  it("returns 409 on duplicate save", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-2","P","c","public",aliceId);
    save(db, bobId, "pub-2");
    const res = save(db, bobId, "pub-2");
    expect(res.status).toBe(409);
  });

  it("returns 404 for non-existent slug", () => {
    const res = save(db, bobId, "does-not-exist");
    expect(res.status).toBe(404);
  });

  it("GET /saved excludes group paste after user leaves the group", () => {
    db.prepare("INSERT INTO group_members (group_id,user_id) VALUES (?,?)").run(groupId, bobId);
    db.prepare("INSERT INTO documents (slug,title,content,privacy,group_id,owner_id) VALUES (?,?,?,?,?,?)").run("grp-3","G","c","group",groupId,aliceId);
    save(db, bobId, "grp-3");

    // While member — paste appears
    expect(listSaved(db, bobId)).toHaveLength(1);

    // Leave group
    db.prepare("DELETE FROM group_members WHERE group_id=? AND user_id=?").run(groupId, bobId);

    // Paste no longer accessible
    expect(listSaved(db, bobId)).toHaveLength(0);
  });

  it("GET /saved re-includes group paste after user rejoins the group", () => {
    db.prepare("INSERT INTO group_members (group_id,user_id) VALUES (?,?)").run(groupId, bobId);
    db.prepare("INSERT INTO documents (slug,title,content,privacy,group_id,owner_id) VALUES (?,?,?,?,?,?)").run("grp-4","G","c","group",groupId,aliceId);
    save(db, bobId, "grp-4");

    db.prepare("DELETE FROM group_members WHERE group_id=? AND user_id=?").run(groupId, bobId);
    expect(listSaved(db, bobId)).toHaveLength(0);

    // Rejoin
    db.prepare("INSERT INTO group_members (group_id,user_id) VALUES (?,?)").run(groupId, bobId);
    expect(listSaved(db, bobId)).toHaveLength(1);
  });

  it("GET /saved returns only pastes the requesting user saved", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-3","P","c","public",aliceId);
    save(db, bobId, "pub-3");
    expect(listSaved(db, aliceId)).toHaveLength(0);
    expect(listSaved(db, bobId)).toHaveLength(1);
  });

  it("unsave removes the row", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-4","P","c","public",aliceId);
    const docId = Number(db.query<{id:number},[string]>("SELECT id FROM documents WHERE slug=?").get("pub-4")!.id);
    save(db, bobId, "pub-4");
    expect(checkSaved(db, bobId, "pub-4")).toBe(true);
    db.prepare("DELETE FROM saved_pastes WHERE user_id=? AND doc_id=?").run(bobId, docId);
    expect(checkSaved(db, bobId, "pub-4")).toBe(false);
  });

  it("checkSaved returns true when saved, false otherwise", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-5","P","c","public",aliceId);
    expect(checkSaved(db, bobId, "pub-5")).toBe(false);
    save(db, bobId, "pub-5");
    expect(checkSaved(db, bobId, "pub-5")).toBe(true);
  });

  it("unsave is idempotent (no error when row does not exist)", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-6","P","c","public",aliceId);
    const docId = Number(db.query<{id:number},[string]>("SELECT id FROM documents WHERE slug=?").get("pub-6")!.id);
    // No-op delete should not throw
    expect(() => db.prepare("DELETE FROM saved_pastes WHERE user_id=? AND doc_id=?").run(bobId, docId)).not.toThrow();
  });

  it("document deletion cascades to saved_pastes", () => {
    db.prepare("INSERT INTO documents (slug,title,content,privacy,owner_id) VALUES (?,?,?,?,?)").run("pub-7","P","c","public",aliceId);
    const docId = Number(db.query<{id:number},[string]>("SELECT id FROM documents WHERE slug=?").get("pub-7")!.id);
    save(db, bobId, "pub-7");
    expect(checkSaved(db, bobId, "pub-7")).toBe(true);
    db.prepare("DELETE FROM documents WHERE id=?").run(docId);
    const row = db.query<any,[number,number]>("SELECT 1 FROM saved_pastes WHERE user_id=? AND doc_id=?").get(bobId, docId);
    expect(row).toBeNull();
  });
});
