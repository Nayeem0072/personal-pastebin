CREATE TABLE IF NOT EXISTS saved_pastes (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  saved_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, doc_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_pastes_user ON saved_pastes(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_pastes_doc  ON saved_pastes(doc_id);
