CREATE TABLE IF NOT EXISTS document_sends (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id       INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sender_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT,
  read_at      INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(doc_id, sender_id, recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_sends_recipient ON document_sends(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sends_sender    ON document_sends(sender_id);
CREATE INDEX IF NOT EXISTS idx_sends_unread    ON document_sends(recipient_id, read_at) WHERE read_at IS NULL;
