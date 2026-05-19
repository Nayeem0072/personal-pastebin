-- Step 1: Rename org tables
ALTER TABLE organizations RENAME TO groups;
ALTER TABLE org_members   RENAME TO group_members;
ALTER TABLE org_join_requests RENAME TO group_join_requests;
ALTER TABLE org_invites   RENAME TO group_code_invites;

-- Step 2: Rename org_id columns (requires SQLite 3.25+)
ALTER TABLE group_members       RENAME COLUMN org_id TO group_id;
ALTER TABLE group_join_requests RENAME COLUMN org_id TO group_id;
ALTER TABLE group_code_invites  RENAME COLUMN org_id TO group_id;

-- Step 3: Rename org_id on documents
ALTER TABLE documents RENAME COLUMN org_id TO group_id;

-- Step 4: Recreate documents table to change CHECK constraint 'org' → 'group'
CREATE TABLE documents_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  title            TEXT    NOT NULL DEFAULT 'Untitled',
  content          TEXT    NOT NULL,
  language         TEXT    NOT NULL DEFAULT 'plaintext',
  description      TEXT,
  highlighted_html TEXT,
  privacy          TEXT    NOT NULL DEFAULT 'public'
                   CHECK(privacy IN ('public','group','private')),
  group_id         INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  owner_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO documents_new
  SELECT id, slug, title, content, language, description, highlighted_html,
         CASE privacy WHEN 'org' THEN 'group' ELSE privacy END,
         group_id, owner_id, created_at, updated_at
  FROM documents;

DROP TABLE documents;
ALTER TABLE documents_new RENAME TO documents;

-- Step 5: Create new group_handle_invites table
CREATE TABLE IF NOT EXISTS group_handle_invites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending'
              CHECK(status IN ('pending','accepted','declined')),
  read_at     INTEGER,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(group_id, invitee_id)
);
CREATE INDEX IF NOT EXISTS idx_ghi_invitee ON group_handle_invites(invitee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghi_group   ON group_handle_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_ghi_unread  ON group_handle_invites(invitee_id, read_at) WHERE read_at IS NULL;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_groups_slug     ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_code_invites_code   ON group_code_invites(code);
CREATE INDEX IF NOT EXISTS idx_group_code_invites_gid    ON group_code_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_docs_slug     ON documents(slug);
CREATE INDEX IF NOT EXISTS idx_docs_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_docs_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_docs_privacy  ON documents(privacy);
CREATE INDEX IF NOT EXISTS idx_docs_created  ON documents(created_at DESC);

-- Step 7: Rebuild FTS5 virtual table (must drop/recreate — shadow tables hold old column name)
DROP TABLE IF EXISTS documents_fts;
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  slug UNINDEXED,
  title,
  content,
  description,
  owner_id  UNINDEXED,
  group_id  UNINDEXED,
  privacy   UNINDEXED,
  content='documents',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Rebuild FTS index from existing rows
INSERT INTO documents_fts(rowid, slug, title, content, description, owner_id, group_id, privacy)
  SELECT id, slug, title, content, description, owner_id, group_id, privacy FROM documents;

-- Step 8: Recreate triggers with new column name
DROP TRIGGER IF EXISTS docs_fts_insert;
DROP TRIGGER IF EXISTS docs_fts_update;
DROP TRIGGER IF EXISTS docs_fts_delete;

CREATE TRIGGER docs_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, slug, title, content, description, owner_id, group_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.description, new.owner_id, new.group_id, new.privacy);
END;

CREATE TRIGGER docs_fts_update AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, description, owner_id, group_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.description, old.owner_id, old.group_id, old.privacy);
  INSERT INTO documents_fts(rowid, slug, title, content, description, owner_id, group_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.description, new.owner_id, new.group_id, new.privacy);
END;

CREATE TRIGGER docs_fts_delete AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, description, owner_id, group_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.description, old.owner_id, old.group_id, old.privacy);
END;
