export interface AuthUser {
  id: number;
  handle: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: number;
}

export interface Document {
  id: number;
  slug: string;
  title: string;
  content: string;
  language: string;
  description: string | null;
  highlighted_html: string | null;
  privacy: "public" | "org" | "private";
  org_id: number | null;
  owner_id: number;
  created_at: number;
  updated_at: number;
}

export interface Org {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  owner_id: number;
  created_at: number;
  updated_at: number;
}

export interface OrgMember {
  org_id: number;
  user_id: number;
  role: "owner" | "admin" | "member";
  joined_at: number;
}

// Hono context variable types
export type Variables = {
  user: AuthUser;
};
