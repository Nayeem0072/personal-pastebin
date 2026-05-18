import { test, expect, uid } from "../fixtures";

test.describe("Auth", () => {
  test("signup via UI creates account and redirects to /new", async ({ auth }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };

    await auth.signupViaUI(user);

    expect(auth["page"].url()).toContain("/new");
    const token = await auth.getToken();
    expect(token).toBeTruthy();
  });

  test("signup shows error for duplicate handle", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };

    // Create the user first via API to lock the handle
    await auth.signupViaApi(user);

    // Try to sign up with the same handle in UI
    await page.goto("/signup");
    await page.locator("#handle").fill(user.handle);
    await page.locator("text=Handle is already taken").waitFor({ timeout: 4000 });

    // Submit button should be disabled
    await expect(page.locator("button[type='submit'].btn-orange")).toBeDisabled();
  });

  test("signup shows error for short password", async ({ auth, page }) => {
    const id = uid();
    await page.goto("/signup");
    await page.locator("#display-name").fill("Test");
    await page.locator("#handle").fill(`u${id}`);
    await page.locator("text=Available").waitFor({ timeout: 4000 });
    await page.locator("#email").fill(`u${id}@test.pp`);
    await page.locator("#password").fill("short");
    await page.locator("button[type='submit'].btn-orange").click();

    await expect(page.locator("text=Password must be at least 8 characters")).toBeVisible({ timeout: 5000 });
  });

  test("login authenticates and redirects to /new", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.signupViaApi(user);

    await auth.loginViaUI(user.email, user.password);

    expect(page.url()).toContain("/new");
    const token = await auth.getToken();
    expect(token).toBeTruthy();
  });

  test("login shows error for wrong credentials", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.signupViaApi(user);

    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill("wrongpassword");
    await page.locator("button[type='submit'].btn-orange").click();

    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 5000 });
  });

  test("logout clears token and redirects to /", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    await auth.logoutViaUI();

    expect(page.url()).toMatch(/\/$/);
    const token = await auth.getToken();
    expect(token).toBeNull();
  });

  test("unauthenticated /new redirects to /login", async ({ page }) => {
    if (process.env.SERVERS_DOWN === "true") test.skip(true, "Servers not running");

    // Make sure no token is set
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));

    await page.goto("/new");
    await page.waitForURL(/\/login/, { timeout: 10000 });

    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("next=");
  });
});
