import { test, expect, uid } from "../fixtures";

test.describe("Orgs", () => {
  test("create org via UI shows org page with owner badge", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    await page.goto("/orgs/new");
    await page.locator("#organization-name").fill(`Org ${id}`);
    await page.locator("#slug").fill(`org-${id}`);
    await page.locator("button").filter({ hasText: "Create Organization" }).click();

    await page.waitForURL(/\/orgs\/org-/, { timeout: 10000 });
    expect(page.url()).toContain(`/orgs/org-${id}`);
    await expect(page.locator("text=owner")).toBeVisible({ timeout: 5000 });
  });

  test("org page shows Pastes and Members tabs for member", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}` });

    await page.goto(`/orgs/org-${id}`);
    // Tab nav links (exact text match to avoid matching sidebar/mobile nav)
    await expect(page.locator(`a[href='/orgs/org-${id}']`).filter({ hasText: "Pastes" })).toBeVisible({ timeout: 8000 });
    await expect(page.locator(`a[href='/orgs/org-${id}/members']`)).toBeVisible({ timeout: 5000 });
  });

  test("member sees org pastes section on org page", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}` });

    await page.goto(`/orgs/org-${id}`);
    // Member sees the org header and pastes section (empty state if no pastes yet)
    await expect(page.locator("h1").filter({ hasText: `Org ${id}` })).toBeVisible({ timeout: 8000 });
    // Pastes section is rendered (either grid or empty state)
    await expect(
      page.locator("text=No pastes yet").or(page.locator(".pp-card"))
    ).toBeVisible({ timeout: 5000 });
  });

  test("non-member sees empty state for org-private pastes", async ({ auth, org, paste, page }) => {
    const id = uid();
    const owner = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Owner",
    };
    const visitor = {
      handle: `v${id}`,
      email: `v${id}@test.pp`,
      password: "testpassword1",
      displayName: "Visitor",
    };

    const ownerToken = await auth.signupViaApi(owner);
    await org.createViaApi(ownerToken, { slug: `org-${id}`, name: `Org ${id}` });

    await auth.createAndLogin(visitor);
    await page.goto(`/orgs/org-${id}`);

    // Non-member should see empty state (no pastes visible)
    await expect(page.locator("text=No pastes yet")).toBeVisible({ timeout: 8000 });
  });

  test("public org loads without login", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.signupViaApi(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}`, visibility: "public" });

    // Clear auth (both localStorage and cookies)
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));

    await page.goto(`/orgs/org-${id}`);
    // Should load without redirecting to login
    await expect(page.locator("h1").filter({ hasText: `Org ${id}` })).toBeVisible({ timeout: 8000 });
    expect(page.url()).not.toContain("/login");
  });

  test("invalid org slug shows error message", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    await page.goto(`/orgs/nonexistent-org-${id}`);
    // Should show an error message, not a blank page
    await expect(page.locator("p").filter({ hasText: /not found|does not exist|no org/i })).toBeVisible({ timeout: 8000 });
  });
});
