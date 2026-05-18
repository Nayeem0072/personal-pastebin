import { apiFetch } from "./client";

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

export interface DocSummary {
  slug: string;
  title: string;
  language: string;
  privacy: string;
  description: string | null;
  created_at: number;
  updated_at?: number;
}

export interface ShareTarget {
  id: number;
  handle: string;
  display_name: string | null;
}

export const docsApi = {
  create: (data: {
    title?: string;
    content: string;
    language?: string;
    description?: string;
    privacy?: string;
    org_id?: number;
  }) =>
    apiFetch<{ slug: string; title: string; language: string; privacy: string; created_at: number }>(
      "/api/documents",
      { method: "POST", body: JSON.stringify(data) }
    ),

  get: (slug: string) =>
    apiFetch<{ doc: Document & { owner: { handle: string; display_name: string | null } } }>(
      `/api/documents/${slug}`
    ),

  update: (
    slug: string,
    data: Partial<Pick<Document, "title" | "content" | "language" | "description" | "privacy" | "org_id">>
  ) =>
    apiFetch<{ doc: Document }>(`/api/documents/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/documents/${slug}`, { method: "DELETE" }),

  list: (page = 1, limit = 20) =>
    apiFetch<{ docs: DocSummary[]; page: number; limit: number; total: number; has_more: boolean }>(
      `/api/documents?page=${page}&limit=${limit}`
    ),

  getShares: (slug: string) =>
    apiFetch<{ shares: (ShareTarget & { shared_at: number })[] }>(`/api/documents/${slug}/shares`),

  addShare: (slug: string, handle_or_email: string) =>
    apiFetch<{ shared_with: ShareTarget }>(`/api/documents/${slug}/shares`, {
      method: "POST",
      body: JSON.stringify({ handle_or_email }),
    }),

  removeShare: (slug: string, userId: number) =>
    apiFetch<{ ok: true }>(`/api/documents/${slug}/shares/${userId}`, { method: "DELETE" }),
};
