import type { Page } from "@playwright/test";

export interface TestUser {
  handle: string;
  email: string;
  password: string;
  displayName: string;
}

export class AuthHelper {
  constructor(private page: Page) {}

  async signupViaApi(user: TestUser): Promise<string> {
    const res = await this.page.request.post("http://localhost:5173/api/auth/signup", {
      data: {
        email: user.email,
        password: user.password,
        handle: user.handle,
        display_name: user.displayName,
      },
    });
    const body = await res.json();
    if (!body.token) throw new Error(`Signup failed: ${JSON.stringify(body)}`);
    return body.token as string;
  }

  async signupViaUI(user: TestUser): Promise<void> {
    await this.page.goto("/signup");
    await this.page.locator("#display-name").fill(user.displayName);
    await this.page.locator("#handle").fill(user.handle);
    await this.page.locator("text=Available").waitFor({ timeout: 4000 });
    await this.page.locator("#email").fill(user.email);
    await this.page.locator("#password").fill(user.password);
    await this.page.locator("button[type='submit'].btn-orange").click();
    await this.page.waitForURL("**/new", { timeout: 10000 });
  }

  async loginViaUI(email: string, password: string): Promise<void> {
    await this.page.goto("/login");
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.locator("button[type='submit'].btn-orange").click();
    await this.page.waitForURL("**/new", { timeout: 10000 });
  }

  async setToken(token: string): Promise<void> {
    await this.page.goto("/");
    await this.page.evaluate((t) => localStorage.setItem("auth_token", t), token);
  }

  async createAndLogin(user: TestUser): Promise<string> {
    const token = await this.signupViaApi(user);
    await this.setToken(token);
    await this.page.goto("/new");
    await this.page.waitForURL("**/new", { timeout: 10000 });
    return token;
  }

  async logoutViaUI(): Promise<void> {
    await this.page.locator('[title="Sign out"]').click();
    await this.page.waitForURL("/", { timeout: 10000 });
  }

  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => localStorage.removeItem("auth_token"));
  }

  async getToken(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem("auth_token"));
  }
}
