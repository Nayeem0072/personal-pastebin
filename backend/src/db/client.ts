import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = process.env.DB_PATH ?? join(import.meta.dir, "../../../pastebin.db");

export const db = new Database(dbPath, { create: true });

// Performance pragmas (applied once on connection)
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA synchronous=NORMAL");
db.exec("PRAGMA busy_timeout=5000");
db.exec("PRAGMA foreign_keys=ON");
db.exec("PRAGMA cache_size=-64000"); // 64MB page cache
