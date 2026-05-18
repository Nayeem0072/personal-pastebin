PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  handle        TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  display_name  TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

CREATE TABLE IF NOT EXISTS organizations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT,
  visibility  TEXT    NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private')),
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_orgs_slug     ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id ON organizations(owner_id);

CREATE TABLE IF NOT EXISTS org_members (
  org_id    INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT    NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','member')),
  joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);

CREATE TABLE IF NOT EXISTS org_invites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code       TEXT    NOT NULL UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  max_uses   INTEGER,
  use_count  INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_org_invites_code   ON org_invites(code);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON org_invites(org_id);

CREATE TABLE IF NOT EXISTS org_join_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_status ON org_join_requests(org_id, status);

CREATE TABLE IF NOT EXISTS documents (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  title            TEXT    NOT NULL DEFAULT 'Untitled',
  content          TEXT    NOT NULL,
  language         TEXT    NOT NULL DEFAULT 'plaintext',
  description      TEXT,
  highlighted_html TEXT,
  privacy          TEXT    NOT NULL DEFAULT 'public' CHECK(privacy IN ('public','org','private')),
  org_id           INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  owner_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_docs_slug     ON documents(slug);
CREATE INDEX IF NOT EXISTS idx_docs_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_docs_org_id   ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_docs_privacy  ON documents(privacy);
CREATE INDEX IF NOT EXISTS idx_docs_created  ON documents(created_at DESC);

CREATE TABLE IF NOT EXISTS document_shares (
  doc_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_by  INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (doc_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_doc_shares_user_id ON document_shares(user_id);

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_rate_limit ON rate_limit_log(key, created_at);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  slug UNINDEXED,
  title,
  content,
  description,
  owner_id UNINDEXED,
  org_id UNINDEXED,
  privacy UNINDEXED,
  content='documents',
  content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS docs_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, slug, title, content, description, owner_id, org_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.description, new.owner_id, new.org_id, new.privacy);
END;

CREATE TRIGGER IF NOT EXISTS docs_fts_update AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, description, owner_id, org_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.description, old.owner_id, old.org_id, old.privacy);
  INSERT INTO documents_fts(rowid, slug, title, content, description, owner_id, org_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.description, new.owner_id, new.org_id, new.privacy);
END;

CREATE TRIGGER IF NOT EXISTS docs_fts_delete AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, description, owner_id, org_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.description, old.owner_id, old.org_id, old.privacy);
END;
