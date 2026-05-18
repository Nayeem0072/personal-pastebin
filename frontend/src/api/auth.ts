import { apiFetch } from "./client";

export interface User {
  id: number;
  handle: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: number;
}

export const authApi = {
  me: () => apiFetch<{ user: User }>("/api/auth/me"),
  login: (email: string, password: string) =>
    apiFetch<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (data: { email: string; password: string; handle: string; display_name?: string }) =>
    apiFetch<{ user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  checkHandle: (handle: string) =>
    apiFetch<{ available: boolean }>(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`),
};
