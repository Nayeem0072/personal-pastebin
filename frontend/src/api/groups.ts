import { apiFetch } from "./client";

export interface Group {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  owner_id: number;
  created_at: number;
  updated_at: number;
}

export interface GroupMember {
  id: number;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: number;
}

export interface GroupCodeInvite {
  id: number;
  code: string;
  max_uses: number | null;
  use_count: number;
  expires_at: number | null;
  created_at: number;
  created_by_handle: string;
}

export interface GroupHandleInvite {
  id: number;
  invitee_handle: string;
  invitee_display_name: string | null;
  inviter_handle: string;
  message: string | null;
  created_at: number;
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

export const groupsApi = {
  create: (data: { slug: string; name: string; description?: string; visibility?: string }) =>
    apiFetch<{ group: Group }>("/api/groups", { method: "POST", body: JSON.stringify(data) }),

  list: () => apiFetch<{ groups: (Group & { role: string })[] }>("/api/groups"),

  search: (q?: string, limit = 20) =>
    apiFetch<{ groups: Group[] }>(`/api/groups/search?q=${encodeURIComponent(q ?? "")}&limit=${limit}`),

  get: (slug: string) =>
    apiFetch<{ group: Group; role: string | null; member_count: number }>(`/api/groups/${slug}`),

  update: (slug: string, data: Partial<Pick<Group, "name" | "description" | "visibility">>) =>
    apiFetch<{ group: Group }>(`/api/groups/${slug}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}`, { method: "DELETE" }),

  getMembers: (slug: string) =>
    apiFetch<{ members: GroupMember[]; my_role: string }>(`/api/groups/${slug}/members`),

  updateMember: (slug: string, userId: number, role: string) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  removeMember: (slug: string, userId: number) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/members/${userId}`, { method: "DELETE" }),

  leave: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/leave`, { method: "POST" }),

  // ── Code-based invites (existing) ──
  createInvite: (slug: string, data?: { max_uses?: number; expires_at?: number }) =>
    apiFetch<{ code: string; max_uses: number | null; expires_at: number | null }>(
      `/api/groups/${slug}/invites`,
      { method: "POST", body: JSON.stringify(data ?? {}) }
    ),

  getInvites: (slug: string) =>
    apiFetch<{ invites: GroupCodeInvite[] }>(`/api/groups/${slug}/invites`),

  deleteInvite: (slug: string, code: string) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/invites/${code}`, { method: "DELETE" }),

  previewJoin: (code: string) =>
    apiFetch<{ group: Group; invite: { expires_at: number | null; max_uses: number | null; use_count: number } }>(
      `/api/groups/join/${code}`
    ),

  joinByCode: (code: string) =>
    apiFetch<{ group: Group; already_member?: boolean }>(`/api/groups/join/${code}`, { method: "POST" }),

  // ── Handle-based invites (new) ──
  sendHandleInvite: (slug: string, handle: string, message?: string) =>
    apiFetch<{ invite_id: number; invitee_handle: string }>(
      `/api/groups/${slug}/handle-invites`,
      { method: "POST", body: JSON.stringify({ handle, message }) }
    ),

  getHandleInvites: (slug: string) =>
    apiFetch<{ invites: GroupHandleInvite[] }>(`/api/groups/${slug}/handle-invites`),

  cancelHandleInvite: (slug: string, id: number) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/handle-invites/${id}`, { method: "DELETE" }),

  respondToHandleInvite: (inviteId: number, action: "accept" | "decline") =>
    apiFetch<{ ok: true }>(`/api/groups/handle-invites/${inviteId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  markHandleInviteRead: (inviteId: number) =>
    apiFetch<{ ok: true }>(`/api/groups/handle-invites/${inviteId}/read`, { method: "PATCH" }),

  // ── Join requests ──
  submitRequest: (slug: string, message?: string) =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/requests`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getRequests: (slug: string, status = "pending") =>
    apiFetch<{ requests: JoinRequest[] }>(`/api/groups/${slug}/requests?status=${status}`),

  reviewRequest: (slug: string, requestId: number, action: "approve" | "reject") =>
    apiFetch<{ ok: true }>(`/api/groups/${slug}/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  getDocuments: (slug: string, page = 1, limit = 30) =>
    apiFetch<{ documents: { slug: string; title: string; language: string; description: string | null; privacy: string; owner_id: number; owner_handle: string; created_at: number }[] }>(
      `/api/groups/${slug}/documents?page=${page}&limit=${limit}`
    ),
};

/** @deprecated Use groupsApi */
export const orgsApi = groupsApi;
/** @deprecated Use Group */
export type Org = Group;
/** @deprecated Use GroupMember */
export type OrgMember = GroupMember;
/** @deprecated Use GroupCodeInvite */
export type OrgInvite = GroupCodeInvite;
