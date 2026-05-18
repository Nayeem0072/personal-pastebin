import { apiFetch } from "./client";
import type { User } from "./auth";

export interface PublicProfile {
  id: number;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: number;
}

export const usersApi = {
  getProfile: (handle: string) =>
    apiFetch<{ user: User | PublicProfile; docs: any[] }>(`/api/users/${handle}`),

  updateMe: (data: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    current_password?: string;
    new_password?: string;
  }) =>
    apiFetch<{ user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  resolve: (q: string) =>
    apiFetch<{ user: { id: number; handle: string; display_name: string | null; avatar_url: string | null } }>(
      `/api/users/resolve?q=${encodeURIComponent(q)}`
    ),
};
