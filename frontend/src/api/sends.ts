import { apiFetch } from "./client";

export interface SendSummary {
  send_id: number;
  message: string | null;
  read_at: number | null;
  sent_at: number;
  slug: string;
  title: string;
  language: string;
  privacy: string;
  description: string | null;
  sender_handle: string;
  sender_display_name: string | null;
}

export type NotificationItem =
  | {
      id: number;
      type: "document_send";
      read_at: number | null;
      created_at: number;
      message: string | null;
      doc_slug: string;
      doc_title: string;
      doc_language: string;
      sender_handle: string;
    }
  | {
      id: number;
      type: "group_invite";
      read_at: number | null;
      created_at: number;
      message: string | null;
      group_slug: string;
      group_name: string;
      inviter_handle: string;
    };

export const sendsApi = {
  send: (data: { doc_slug: string; handle_or_email: string; message?: string }) =>
    apiFetch<{ id: number; sent_to: { handle: string; display_name: string | null } }>(
      "/api/sends",
      { method: "POST", body: JSON.stringify(data) }
    ),

  getInbox: (page = 1, limit = 20, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    return apiFetch<{
      sends: SendSummary[];
      page: number;
      limit: number;
      total: number;
      has_more: boolean;
    }>(`/api/sends/inbox?${params}`);
  },

  getNotifications: () =>
    apiFetch<{ notifications: NotificationItem[] }>("/api/sends/notifications"),

  getUnreadCount: () =>
    apiFetch<{ count: number }>("/api/sends/unread-count"),

  markRead: (sendId: number) =>
    apiFetch<{ ok: true }>(`/api/sends/${sendId}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiFetch<{ ok: true; updated: number }>("/api/sends/read-all", { method: "PATCH" }),
};
