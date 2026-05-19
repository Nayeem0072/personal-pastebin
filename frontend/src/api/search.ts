import { apiFetch } from "./client";

export interface SearchResult {
  slug: string;
  title: string;
  language: string;
  privacy: string;
  group_id: number | null;
  created_at: number;
  owner_handle: string;
  owner_display_name: string | null;
  excerpt: string;
}

export const searchApi = {
  search: (params: { q: string; org?: string; lang?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    qs.set("q", params.q);
    if (params.org) qs.set("org", params.org);
    if (params.lang) qs.set("lang", params.lang);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return apiFetch<{ results: SearchResult[]; total: number; page: number; limit: number; has_more: boolean }>(
      `/api/search?${qs}`
    );
  },
};
