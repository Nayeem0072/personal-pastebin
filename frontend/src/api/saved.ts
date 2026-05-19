import { apiFetch } from "./client";

export interface SavedPasteSummary {
  saved_at:      number;
  slug:          string;
  title:         string;
  language:      string;
  privacy:       string;
  group_id:      number | null;
  description:   string | null;
  created_at:    number;
  owner_handle:  string;
  owner_display: string | null;
}

export const savedApi = {
  save: (slug: string) =>
    apiFetch<{ ok: true; saved_at: number }>("/api/saved", {
      method: "POST",
      body: JSON.stringify({ slug }),
    }),

  unsave: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/saved/${slug}`, { method: "DELETE" }),

  list: (page = 1, limit = 20, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    return apiFetch<{
      pastes:   SavedPasteSummary[];
      page:     number;
      limit:    number;
      total:    number;
      has_more: boolean;
    }>(`/api/saved?${params}`);
  },

  checkSaved: (slug: string) =>
    apiFetch<{ is_saved: boolean }>(`/api/saved/check/${slug}`),
};
