import { test, expect, uid } from "../fixtures";

test.describe("Pastes", () => {
  test("create public paste via UI shows title and content", async ({ auth, paste, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    const slug = await paste.createViaUI({
      title: `Paste ${id}`,
      content: `Hello from ${id}`,
    });

    expect(page.url()).toContain(`/docs/${slug}`);
    await expect(page.locator("h1")).toContainText(`Paste ${id}`);
    await expect(page.locator("pre").first()).toContainText(`Hello from ${id}`);
  });

  test("view public paste without login loads page", async ({ paste, auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.signupViaApi(user);
    const slug = await paste.createViaApi(token, { content: `Public content ${id}` });

    // Clear auth (both localStorage and cookies)
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));
    await page.goto(`/docs/${slug}`);

    // Should not redirect to login
    expect(page.url()).toContain(`/docs/${slug}`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
  });

  test("edit paste updates content", async ({ auth, paste, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    const slug = await paste.createViaApi(token, {
      title: `Edit Test ${id}`,
      content: "original content",
    });

    await page.goto(`/docs/${slug}/edit`);
    await page.waitForURL(/\/edit/, { timeout: 10000 });

    // Clear content and type new content
    const contentArea = page.locator("textarea.pp-input");
    await contentArea.fill("updated content");

    await page.locator("button").filter({ hasText: "Save Changes" }).click();
    await page.waitForURL(/\/docs\//, { timeout: 10000 });

    // Updated content should be displayed in the code viewer
    await expect(page.locator("pre").first()).toContainText("updated content", { timeout: 5000 });
  });

  test("non-owner cannot see Edit or Delete buttons", async ({ auth, paste, page }) => {
    const id = uid();
    const owner = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Owner",
    };
    const viewer = {
      handle: `v${id}`,
      email: `v${id}@test.pp`,
      password: "testpassword1",
      displayName: "Viewer",
    };

    const ownerToken = await auth.signupViaApi(owner);
    const slug = await paste.createViaApi(ownerToken, { content: `Non-owner test ${id}` });

    await auth.createAndLogin(viewer);

    await page.goto(`/docs/${slug}`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });

    // Edit and Delete buttons should not be present
    await expect(page.locator("button").filter({ hasText: "Edit" })).not.toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Delete" })).not.toBeVisible();
  });

  test("delete paste navigates away and shows 404 on re-visit", async ({ auth, paste, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    const slug = await paste.createViaApi(token, { content: `To be deleted ${id}` });

    await page.goto(`/docs/${slug}`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });

    // Open delete modal and confirm
    await page.locator("button").filter({ hasText: "Delete" }).click();
    await page.locator("button").filter({ hasText: "Delete" }).last().click();

    // Should navigate away
    await page.waitForURL(new RegExp(`/${user.handle}`), { timeout: 10000 });
    expect(page.url()).not.toContain(`/docs/${slug}`);

    // Re-visiting the slug shows 404
    await page.goto(`/docs/${slug}`);
    await expect(page.locator("text=404")).toBeVisible({ timeout: 8000 });
  });

  test("private paste shows error for non-owner", async ({ auth, paste, page }) => {
    const id = uid();
    const owner = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Owner",
    };
    const other = {
      handle: `o${id}`,
      email: `o${id}@test.pp`,
      password: "testpassword1",
      displayName: "Other",
    };

    const ownerToken = await auth.signupViaApi(owner);
    const slug = await paste.createViaApi(ownerToken, {
      content: `Private content ${id}`,
      privacy: "private",
    });

    await auth.createAndLogin(other);
    await page.goto(`/docs/${slug}`);

    // Should show an error state (404 is always shown in error view)
    await expect(page.locator("text=404")).toBeVisible({ timeout: 8000 });
  });

  test("owner sees Share button on private paste", async ({ auth, paste, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    const slug = await paste.createViaApi(token, {
      content: `Private share test ${id}`,
      privacy: "private",
    });

    await page.goto(`/docs/${slug}`);
    await expect(page.locator("button").filter({ hasText: "Share" })).toBeVisible({ timeout: 8000 });
  });

  test("empty content disables Save button on /new", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    await page.goto("/new");
    await page.waitForURL("**/new", { timeout: 10000 });

    await expect(page.locator("button").filter({ hasText: "Save Paste" })).toBeDisabled();
  });
});
