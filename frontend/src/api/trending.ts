import { apiFetch } from "./client";

export interface TrendingDoc {
  slug: string;
  title: string;
  language: string;
  privacy: string;
  created_at: number;
  view_count: number;
  weekly_views: number;
  owner_handle: string;
  owner_display_name: string | null;
}

export const trendingApi = {
  list: (limit = 20, days = 7) =>
    apiFetch<{ results: TrendingDoc[]; window_days: number }>(
      `/api/trending?limit=${limit}&days=${days}`
    ),
};
