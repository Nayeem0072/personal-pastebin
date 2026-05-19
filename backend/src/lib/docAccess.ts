import { db } from "../db/client";
import type { Document } from "../types/index";

export function canViewDoc(doc: Document, userId: number | null): boolean {
  if (doc.privacy === "public") return true;
  if (!userId) return false;
  if (doc.owner_id === userId) return true;
  if (doc.privacy === "private") {
    const shared = db
      .query<{ doc_id: number }, [number, number]>(
        "SELECT doc_id FROM document_shares WHERE doc_id = ? AND user_id = ?"
      )
      .get(doc.id, userId);
    return !!shared;
  }
  if (doc.privacy === "group" && doc.group_id) {
    const member = db
      .query<{ user_id: number }, [number, number]>(
        "SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?"
      )
      .get(doc.group_id, userId);
    return !!member;
  }
  return false;
}
