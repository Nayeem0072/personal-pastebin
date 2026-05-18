import { db } from "./client";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const migrationsDir = join(import.meta.dir, "migrations");

function runMigrations() {
  // Track applied migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const applied = new Set(
    db.query<{ name: string }, []>("SELECT name FROM _migrations ORDER BY name").all().map((r) => r.name)
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`[migrate] Applying ${file}`);
    db.exec(sql);
    db.query("INSERT INTO _migrations (name) VALUES (?)").run(file);
  }

  console.log("[migrate] Done");
}

runMigrations();
