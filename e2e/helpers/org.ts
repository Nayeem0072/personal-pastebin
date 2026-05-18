import type { Page } from "@playwright/test";

export interface OrgOptions {
  slug: string;
  name: string;
  description?: string;
  visibility?: "public" | "private";
}

export class OrgHelper {
  constructor(private page: Page) {}

  async createViaApi(token: string, opts: OrgOptions): Promise<void> {
    const res = await this.page.request.post("http://localhost:5173/api/orgs", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      data: {
        slug: opts.slug,
        name: opts.name,
        description: opts.description ?? "",
        visibility: opts.visibility ?? "public",
      },
    });
    const body = await res.json();
    if (!body.org) throw new Error(`Create org failed: ${JSON.stringify(body)}`);
  }

  async createInviteViaApi(token: string, orgSlug: string): Promise<string> {
    const res = await this.page.request.post(
      `http://localhost:5173/api/orgs/${orgSlug}/invites`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        data: {},
      }
    );
    const body = await res.json();
    if (!body.code) throw new Error(`Create invite failed: ${JSON.stringify(body)}`);
    return body.code as string;
  }
}
