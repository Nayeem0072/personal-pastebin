/**
 * Tests for GET /api/sends/notifications
 *
 * Verifies that document_send and group_invite notifications are both returned
 * correctly after the fix that split the UNION ALL into two separate queries.
 */
import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";

// ── Schema ──────────────────────────────────────────────────────────────────

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
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      visibility  TEXT NOT NULL DEFAULT 'public',
      owner_id    INTEGER NOT NULL REFERENCES users(id),
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE documents (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      slug     TEXT NOT NULL UNIQUE,
      title    TEXT NOT NULL DEFAULT 'Untitled',
      content  TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'plaintext',
      highlighted_html TEXT,
      privacy  TEXT NOT NULL DEFAULT 'public',
      group_id INTEGER REFERENCES groups(id),
      owner_id INTEGER NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE document_sends (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id       INTEGER NOT NULL REFERENCES documents(id),
      sender_id    INTEGER NOT NULL REFERENCES users(id),
      recipient_id INTEGER NOT NULL REFERENCES users(id),
      message      TEXT,
      read_at      INTEGER,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(doc_id, sender_id, recipient_id)
    );

    CREATE TABLE group_handle_invites (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id   INTEGER NOT NULL REFERENCES groups(id),
      inviter_id INTEGER NOT NULL REFERENCES users(id),
      invitee_id INTEGER NOT NULL REFERENCES users(id),
      message    TEXT,
      status     TEXT NOT NULL DEFAULT 'pending',
      read_at    INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(group_id, invitee_id)
    );
  `);

  return db;
}

// ── Query helpers (mirrors the fixed sends.ts route) ────────────────────────

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

function getNotifications(db: Database, userId: number): NotificationRow[] {
  const docSends = db
    .query<NotificationRow, [number]>(
      `SELECT
         ds.id           AS id,
         'document_send' AS type,
         ds.read_at,
         ds.created_at,
         ds.message,
         d.slug          AS doc_slug,
         d.title         AS doc_title,
         d.language      AS doc_language,
         u.handle        AS sender_handle,
         NULL            AS group_slug,
         NULL            AS group_name,
         NULL            AS inviter_handle
       FROM document_sends ds
       JOIN documents d ON ds.doc_id    = d.id
       JOIN users u     ON ds.sender_id = u.id
       WHERE ds.recipient_id = ?`
    )
    .all(userId);

  const groupInvites = db
    .query<NotificationRow, [number]>(
      `SELECT
         gi.id          AS id,
         'group_invite' AS type,
         gi.read_at,
         gi.created_at,
         gi.message,
         NULL           AS doc_slug,
         NULL           AS doc_title,
         NULL           AS doc_language,
         NULL           AS sender_handle,
         g.slug         AS group_slug,
         g.name         AS group_name,
         u.handle       AS inviter_handle
       FROM group_handle_invites gi
       JOIN groups g ON gi.group_id  = g.id
       JOIN users u  ON gi.inviter_id = u.id
       WHERE gi.invitee_id = ? AND gi.status = 'pending'`
    )
    .all(userId);

  return [...docSends, ...groupInvites]
    .sort((a, b) => {
      if (a.read_at === null && b.read_at !== null) return -1;
      if (a.read_at !== null && b.read_at === null) return 1;
      return b.created_at - a.created_at;
    })
    .slice(0, 25);
}

function getUnreadCount(db: Database, userId: number): number {
  const row = db
    .query<{ cnt: number }, [number, number]>(
      `SELECT (
         SELECT COUNT(*) FROM document_sends WHERE recipient_id = ? AND read_at IS NULL
       ) + (
         SELECT COUNT(*) FROM group_handle_invites WHERE invitee_id = ? AND status = 'pending' AND read_at IS NULL
       ) AS cnt`
    )
    .get(userId, userId)!;
  return row.cnt;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("notifications endpoint", () => {
  let db: Database;
  let aliceId: number;
  let bobId: number;
  let carolId: number;

  beforeEach(() => {
    db = buildDb();

    // Seed users
    aliceId = Number(
      db.prepare("INSERT INTO users (handle, email, password_hash) VALUES (?,?,?)").run("alice", "alice@test.com", "x").lastInsertRowid
    );
    bobId = Number(
      db.prepare("INSERT INTO users (handle, email, password_hash) VALUES (?,?,?)").run("bob", "bob@test.com", "x").lastInsertRowid
    );
    carolId = Number(
      db.prepare("INSERT INTO users (handle, email, password_hash) VALUES (?,?,?)").run("carol", "carol@test.com", "x").lastInsertRowid
    );
  });

  it("returns both document_send and group_invite notifications for the recipient", () => {
    // Alice sends a doc to Bob
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, owner_id) VALUES (?,?,?,?)").run("doc-1", "Hello World", "content", aliceId).lastInsertRowid
    );
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id, message) VALUES (?,?,?,?)")
      .run(docId, aliceId, bobId, "Check this out");

    // Carol invites Bob to a group
    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("eng-team", "Eng Team", carolId).lastInsertRowid
    );
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, message) VALUES (?,?,?,?)")
      .run(groupId, carolId, bobId, "Join us!");

    const notifications = getNotifications(db, bobId);

    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.type).sort()).toEqual(["document_send", "group_invite"]);
  });

  it("document_send notification has correct fields", () => {
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, language, owner_id) VALUES (?,?,?,?,?)").run("doc-2", "My Paste", "code here", "typescript", aliceId).lastInsertRowid
    );
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id, message) VALUES (?,?,?,?)")
      .run(docId, aliceId, bobId, "FYI");

    const notifications = getNotifications(db, bobId);
    const n = notifications.find((x) => x.type === "document_send")!;

    expect(n.doc_slug).toBe("doc-2");
    expect(n.doc_title).toBe("My Paste");
    expect(n.doc_language).toBe("typescript");
    expect(n.sender_handle).toBe("alice");
    expect(n.message).toBe("FYI");
    expect(n.group_slug).toBeNull();
    expect(n.group_name).toBeNull();
    expect(n.inviter_handle).toBeNull();
  });

  it("group_invite notification has correct fields", () => {
    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("design", "Design Team", carolId).lastInsertRowid
    );
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, message) VALUES (?,?,?,?)")
      .run(groupId, carolId, bobId, "Welcome aboard");

    const notifications = getNotifications(db, bobId);
    const n = notifications.find((x) => x.type === "group_invite")!;

    expect(n.group_slug).toBe("design");
    expect(n.group_name).toBe("Design Team");
    expect(n.inviter_handle).toBe("carol");
    expect(n.message).toBe("Welcome aboard");
    expect(n.doc_slug).toBeNull();
    expect(n.sender_handle).toBeNull();
  });

  it("does not include declined or accepted group invites", () => {
    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g1", "G1", aliceId).lastInsertRowid
    );
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, status) VALUES (?,?,?,?)")
      .run(groupId, aliceId, bobId, "declined");

    const group2Id = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g2", "G2", aliceId).lastInsertRowid
    );
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, status) VALUES (?,?,?,?)")
      .run(group2Id, aliceId, carolId, "accepted");

    const bobNotifications = getNotifications(db, bobId);
    const carolNotifications = getNotifications(db, carolId);

    expect(bobNotifications).toHaveLength(0);
    expect(carolNotifications).toHaveLength(0);
  });

  it("returns no notifications when there are none", () => {
    const notifications = getNotifications(db, bobId);
    expect(notifications).toHaveLength(0);
  });

  it("does not return notifications belonging to other users", () => {
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, owner_id) VALUES (?,?,?,?)").run("doc-3", "Private", "...", aliceId).lastInsertRowid
    );
    // Send to Carol, not Bob
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id) VALUES (?,?,?)")
      .run(docId, aliceId, carolId);

    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g3", "G3", aliceId).lastInsertRowid
    );
    // Invite Carol, not Bob
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id) VALUES (?,?,?)")
      .run(groupId, aliceId, carolId);

    expect(getNotifications(db, bobId)).toHaveLength(0);
    expect(getNotifications(db, carolId)).toHaveLength(2);
  });

  it("sorts unread before read, then newest first within each bucket", () => {
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, owner_id) VALUES (?,?,?,?)").run("doc-4", "T", "c", aliceId).lastInsertRowid
    );
    // Older unread doc send (created_at = 100)
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id, read_at, created_at) VALUES (?,?,?,?,?)")
      .run(docId, aliceId, bobId, null, 100);

    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g4", "G4", carolId).lastInsertRowid
    );
    // Newer read group invite (created_at = 200, read_at set)
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, read_at, created_at) VALUES (?,?,?,?,?)")
      .run(groupId, carolId, bobId, 999, 200);

    const notifications = getNotifications(db, bobId);

    expect(notifications).toHaveLength(2);
    // Unread doc_send should come first despite being older
    expect(notifications[0].type).toBe("document_send");
    expect(notifications[0].read_at).toBeNull();
    expect(notifications[1].type).toBe("group_invite");
    expect(notifications[1].read_at).toBe(999);
  });

  it("unread-count sums both sources correctly", () => {
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, owner_id) VALUES (?,?,?,?)").run("doc-5", "T", "c", aliceId).lastInsertRowid
    );
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id) VALUES (?,?,?)").run(docId, aliceId, bobId);

    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g5", "G5", carolId).lastInsertRowid
    );
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id) VALUES (?,?,?)").run(groupId, carolId, bobId);

    expect(getUnreadCount(db, bobId)).toBe(2);
  });

  it("unread-count excludes read doc sends and non-pending group invites", () => {
    const docId = Number(
      db.prepare("INSERT INTO documents (slug, title, content, owner_id) VALUES (?,?,?,?)").run("doc-6", "T", "c", aliceId).lastInsertRowid
    );
    // Already-read doc send
    db.prepare("INSERT INTO document_sends (doc_id, sender_id, recipient_id, read_at) VALUES (?,?,?,?)")
      .run(docId, aliceId, bobId, 12345);

    const groupId = Number(
      db.prepare("INSERT INTO groups (slug, name, owner_id) VALUES (?,?,?)").run("g6", "G6", carolId).lastInsertRowid
    );
    // Accepted group invite (not pending)
    db.prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, status) VALUES (?,?,?,?)")
      .run(groupId, carolId, bobId, "accepted");

    expect(getUnreadCount(db, bobId)).toBe(0);
  });
});
