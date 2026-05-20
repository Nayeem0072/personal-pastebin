ALTER TABLE documents ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE document_views (
  doc_id    INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_doc_views_doc  ON document_views(doc_id);
CREATE INDEX idx_doc_views_time ON document_views(viewed_at DESC);
