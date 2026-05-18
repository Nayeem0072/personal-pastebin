import type { Page } from "@playwright/test";

export interface PasteOptions {
  title?: string;
  content: string;
  privacy?: "public" | "org" | "private";
  language?: string;
}

export class PasteHelper {
  constructor(private page: Page) {}

  async createViaApi(token: string, opts: PasteOptions): Promise<string> {
    const res = await this.page.request.post("http://localhost:5173/api/documents", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      data: {
        title: opts.title ?? "Test Paste",
        content: opts.content,
        language: opts.language ?? "plaintext",
        privacy: opts.privacy ?? "public",
      },
    });
    const body = await res.json();
    if (!body.slug) throw new Error(`Create paste failed: ${JSON.stringify(body)}`);
    return body.slug as string;
  }

  async createViaUI(opts: PasteOptions): Promise<string> {
    await this.page.goto("/new");
    if (opts.title) {
      await this.page.locator('.pp-input[placeholder="Untitled paste"]').fill(opts.title);
    }
    await this.page.locator("textarea.pp-input").fill(opts.content);
    if (opts.privacy && opts.privacy !== "public") {
      await this.page.locator("select").nth(1).selectOption(opts.privacy);
    }
    await this.page.locator("button.btn-orange").filter({ hasText: "Save Paste" }).click();
    await this.page.waitForURL(/\/docs\//, { timeout: 10000 });
    const url = this.page.url();
    return url.split("/docs/")[1].replace(/\/$/, "");
  }
}
