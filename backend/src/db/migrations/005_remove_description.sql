-- Remove the description column from documents and rebuild FTS/triggers without it.
-- SQLite requires a full table rebuild to drop a column.

-- Step 1: Rebuild documents table without description
CREATE TABLE documents_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  title            TEXT    NOT NULL DEFAULT 'Untitled',
  content          TEXT    NOT NULL,
  language         TEXT    NOT NULL DEFAULT 'plaintext',
  highlighted_html TEXT,
  privacy          TEXT    NOT NULL DEFAULT 'public'
                   CHECK(privacy IN ('public','group','private')),
  group_id         INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  owner_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO documents_new
  SELECT id, slug, title, content, language, highlighted_html,
         privacy, group_id, owner_id, created_at, updated_at
  FROM documents;

DROP TABLE documents;
ALTER TABLE documents_new RENAME TO documents;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_docs_slug     ON documents(slug);
CREATE INDEX IF NOT EXISTS idx_docs_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_docs_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_docs_privacy  ON documents(privacy);
CREATE INDEX IF NOT EXISTS idx_docs_created  ON documents(created_at DESC);

-- Step 2: Rebuild FTS table without description
DROP TABLE IF EXISTS documents_fts;
CREATE VIRTUAL TABLE documents_fts USING fts5(
  slug      UNINDEXED,
  title,
  content,
  owner_id  UNINDEXED,
  group_id  UNINDEXED,
  privacy   UNINDEXED,
  content='documents',
  content_rowid='id',
  tokenize='porter unicode61'
);

INSERT INTO documents_fts(rowid, slug, title, content, owner_id, group_id, privacy)
  SELECT id, slug, title, content, owner_id, group_id, privacy FROM documents;

-- Step 3: Recreate triggers without description
DROP TRIGGER IF EXISTS docs_fts_insert;
DROP TRIGGER IF EXISTS docs_fts_update;
DROP TRIGGER IF EXISTS docs_fts_delete;

CREATE TRIGGER docs_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, slug, title, content, owner_id, group_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.owner_id, new.group_id, new.privacy);
END;

CREATE TRIGGER docs_fts_update AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, owner_id, group_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.owner_id, old.group_id, old.privacy);
  INSERT INTO documents_fts(rowid, slug, title, content, owner_id, group_id, privacy)
  VALUES (new.id, new.slug, new.title, new.content, new.owner_id, new.group_id, new.privacy);
END;

CREATE TRIGGER docs_fts_delete AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, slug, title, content, owner_id, group_id, privacy)
  VALUES ('delete', old.id, old.slug, old.title, old.content, old.owner_id, old.group_id, old.privacy);
END;
