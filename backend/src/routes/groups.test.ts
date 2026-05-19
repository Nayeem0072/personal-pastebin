/**
 * Tests for group handle-invite logic
 * Focuses on the re-invite bug: declined/accepted invites must not block a new invite.
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

// Mirrors the fixed POST /:slug/handle-invites logic
function sendInvite(
  db: Database,
  groupId: number,
  inviterId: number,
  inviteeId: number,
  message: string | null = null
): { status: number; body: any } {
  // Check already a member
  const member = db
    .query<{ user_id: number }, [number, number]>(
      "SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?"
    )
    .get(groupId, inviteeId);
  if (member) return { status: 400, body: { error: "User is already a member" } };

  const existing = db
    .query<{ id: number; status: string }, [number, number]>(
      "SELECT id, status FROM group_handle_invites WHERE group_id = ? AND invitee_id = ?"
    )
    .get(groupId, inviteeId);

  if (existing) {
    if (existing.status === "pending") {
      return { status: 409, body: { error: "This user already has a pending invite to this group" } };
    }
    db.prepare(
      "UPDATE group_handle_invites SET status='pending', inviter_id=?, message=?, read_at=NULL, created_at=unixepoch() WHERE id=?"
    ).run(inviterId, message, existing.id);
    return { status: 201, body: { invite_id: existing.id } };
  }

  const result = db
    .prepare("INSERT INTO group_handle_invites (group_id, inviter_id, invitee_id, message) VALUES (?,?,?,?)")
    .run(groupId, inviterId, inviteeId, message);
  return { status: 201, body: { invite_id: Number(result.lastInsertRowid) } };
}

describe("group handle invites — re-invite after resolution", () => {
  let db: Database;
  let adminId: number;
  let inviteeId: number;
  let groupId: number;

  beforeEach(() => {
    db = buildDb();
    adminId = Number(
      db.prepare("INSERT INTO users (handle,email,password_hash) VALUES (?,?,?)").run("admin", "admin@t.com", "x").lastInsertRowid
    );
    inviteeId = Number(
      db.prepare("INSERT INTO users (handle,email,password_hash) VALUES (?,?,?)").run("bob", "bob@t.com", "x").lastInsertRowid
    );
    groupId = Number(
      db.prepare("INSERT INTO groups (slug,name,owner_id) VALUES (?,?,?)").run("eng", "Eng", adminId).lastInsertRowid
    );
  });

  it("sends a fresh invite with no prior history", () => {
    const res = sendInvite(db, groupId, adminId, inviteeId);
    expect(res.status).toBe(201);

    const row = db.query<{ status: string }, [number]>("SELECT status FROM group_handle_invites WHERE id=?").get(res.body.invite_id)!;
    expect(row.status).toBe("pending");
  });

  it("returns 409 when a pending invite already exists", () => {
    sendInvite(db, groupId, adminId, inviteeId);
    const res = sendInvite(db, groupId, adminId, inviteeId);
    expect(res.status).toBe(409);
  });

  it("allows re-invite after invitee declines", () => {
    const first = sendInvite(db, groupId, adminId, inviteeId);
    db.prepare("UPDATE group_handle_invites SET status='declined' WHERE id=?").run(first.body.invite_id);

    const second = sendInvite(db, groupId, adminId, inviteeId, "Please reconsider");
    expect(second.status).toBe(201);

    const row = db.query<{ status: string; message: string | null; read_at: number | null }, [number]>(
      "SELECT status, message, read_at FROM group_handle_invites WHERE id=?"
    ).get(second.body.invite_id)!;
    expect(row.status).toBe("pending");
    expect(row.message).toBe("Please reconsider");
    expect(row.read_at).toBeNull();
  });

  it("allows re-invite after previous invite was accepted then user leaves", () => {
    const first = sendInvite(db, groupId, adminId, inviteeId);
    db.prepare("UPDATE group_handle_invites SET status='accepted' WHERE id=?").run(first.body.invite_id);
    // User left, so no longer in group_members

    const second = sendInvite(db, groupId, adminId, inviteeId);
    expect(second.status).toBe(201);

    const row = db.query<{ status: string }, [number]>("SELECT status FROM group_handle_invites WHERE id=?").get(second.body.invite_id)!;
    expect(row.status).toBe("pending");
  });

  it("reuses the same row id when resetting a declined invite", () => {
    const first = sendInvite(db, groupId, adminId, inviteeId);
    db.prepare("UPDATE group_handle_invites SET status='declined' WHERE id=?").run(first.body.invite_id);

    const second = sendInvite(db, groupId, adminId, inviteeId);
    // Same underlying row, just reset
    expect(second.body.invite_id).toBe(first.body.invite_id);
  });

  it("returns 400 if user is already a member", () => {
    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?,?)").run(groupId, inviteeId);
    const res = sendInvite(db, groupId, adminId, inviteeId);
    expect(res.status).toBe(400);
  });

  it("pending invites list shows re-sent invite", () => {
    const first = sendInvite(db, groupId, adminId, inviteeId);
    db.prepare("UPDATE group_handle_invites SET status='declined' WHERE id=?").run(first.body.invite_id);
    sendInvite(db, groupId, adminId, inviteeId);

    const pending = db
      .query<{ id: number }, [number]>(
        "SELECT id FROM group_handle_invites WHERE group_id=? AND status='pending'"
      )
      .all(groupId);
    expect(pending).toHaveLength(1);
  });
});
