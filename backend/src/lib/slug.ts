import { customAlphabet } from "nanoid";
import { db } from "../db/client";

// URL-safe alphabet without look-alike chars
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 8);

const checkSlug = db.query<{ id: number }, [string]>(
  "SELECT id FROM documents WHERE slug = ? LIMIT 1"
);

export function generateSlug(): string {
  let slug: string;
  let attempts = 0;
  do {
    if (attempts > 10) throw new Error("Failed to generate unique slug after 10 attempts");
    slug = nanoid();
    attempts++;
  } while (checkSlug.get(slug) !== null);
  return slug;
}
