import { apiFetch } from "./client";

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
  id: number;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: number;
}

export interface OrgInvite {
  id: number;
  code: string;
  max_uses: number | null;
  use_count: number;
  expires_at: number | null;
  created_at: number;
  created_by_handle: string;
}

export interface JoinRequest {
  id: number;
  message: string | null;
  status: string;
  created_at: number;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const orgsApi = {
  create: (data: { slug: string; name: string; description?: string; visibility?: string }) =>
    apiFetch<{ org: Org }>("/api/orgs", { method: "POST", body: JSON.stringify(data) }),

  list: () => apiFetch<{ orgs: (Org & { role: string })[] }>("/api/orgs"),

  search: (q?: string, limit = 20) =>
    apiFetch<{ orgs: Org[] }>(`/api/orgs/search?q=${encodeURIComponent(q ?? "")}&limit=${limit}`),

  get: (slug: string) =>
    apiFetch<{ org: Org; role: string | null; member_count: number }>(`/api/orgs/${slug}`),

  update: (slug: string, data: Partial<Pick<Org, "name" | "description" | "visibility">>) =>
    apiFetch<{ org: Org }>(`/api/orgs/${slug}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}`, { method: "DELETE" }),

  getMembers: (slug: string) =>
    apiFetch<{ members: OrgMember[]; my_role: string }>(`/api/orgs/${slug}/members`),

  updateMember: (slug: string, userId: number, role: string) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  removeMember: (slug: string, userId: number) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/members/${userId}`, { method: "DELETE" }),

  leave: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/leave`, { method: "POST" }),

  createInvite: (slug: string, data?: { max_uses?: number; expires_at?: number }) =>
    apiFetch<{ code: string; max_uses: number | null; expires_at: number | null }>(
      `/api/orgs/${slug}/invites`,
      { method: "POST", body: JSON.stringify(data ?? {}) }
    ),

  getInvites: (slug: string) =>
    apiFetch<{ invites: OrgInvite[] }>(`/api/orgs/${slug}/invites`),

  deleteInvite: (slug: string, code: string) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/invites/${code}`, { method: "DELETE" }),

  previewJoin: (code: string) =>
    apiFetch<{ org: Org; invite: { expires_at: number | null; max_uses: number | null; use_count: number } }>(
      `/api/orgs/join/${code}`
    ),

  joinByCode: (code: string) =>
    apiFetch<{ org: Org; already_member?: boolean }>(`/api/orgs/join/${code}`, { method: "POST" }),

  submitRequest: (slug: string, message?: string) =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/requests`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getRequests: (slug: string, status = "pending") =>
    apiFetch<{ requests: JoinRequest[] }>(`/api/orgs/${slug}/requests?status=${status}`),

  reviewRequest: (slug: string, requestId: number, action: "approve" | "reject") =>
    apiFetch<{ ok: true }>(`/api/orgs/${slug}/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
};
