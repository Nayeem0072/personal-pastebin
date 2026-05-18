import { test, expect, uid } from "../fixtures";

test.describe("Invite Flow", () => {
  test("create invite shows link and use count", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.createAndLogin(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}` });

    await page.goto(`/orgs/org-${id}/invites`);
    await page.locator("button").filter({ hasText: "Create Invite" }).click();

    // Invite link should appear in a code element
    await expect(page.locator("code")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("code")).toContainText("/join/");
    await expect(page.locator("text=Used: 0")).toBeVisible({ timeout: 5000 });
  });

  test("join org via invite when logged in redirects to org page", async ({ auth, org, page }) => {
    const id = uid();
    const owner = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Owner",
    };
    const joiner = {
      handle: `j${id}`,
      email: `j${id}@test.pp`,
      password: "testpassword1",
      displayName: "Joiner",
    };

    const ownerToken = await auth.signupViaApi(owner);
    await org.createViaApi(ownerToken, { slug: `org-${id}`, name: `Org ${id}` });
    const code = await org.createInviteViaApi(ownerToken, `org-${id}`);

    await auth.createAndLogin(joiner);
    await page.goto(`/join/${code}`);

    // Should auto-join and redirect to org page
    await page.waitForURL(/\/orgs\/org-/, { timeout: 15000 });
    expect(page.url()).toContain(`/orgs/org-${id}`);
  });

  test("join page when logged out shows org name and auth buttons", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.signupViaApi(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}` });
    const code = await org.createInviteViaApi(token, `org-${id}`);

    // Visit as logged-out user (clear both localStorage and cookies)
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));
    await page.goto(`/join/${code}`);

    await expect(page.locator("h1").filter({ hasText: `Org ${id}` })).toBeVisible({ timeout: 8000 });
    await expect(page.locator("button").filter({ hasText: "Sign Up to Join" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button").filter({ hasText: "Sign In to Join" })).toBeVisible({ timeout: 5000 });
  });

  test("Sign Up to Join redirects to signup with next param", async ({ auth, org, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    const token = await auth.signupViaApi(user);
    await org.createViaApi(token, { slug: `org-${id}`, name: `Org ${id}` });
    const code = await org.createInviteViaApi(token, `org-${id}`);

    // Visit as logged-out user (clear both localStorage and cookies)
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));
    await page.goto(`/join/${code}`);

    await page.locator("text=Sign Up to Join").click();

    await page.waitForURL(/\/signup/, { timeout: 8000 });
    expect(page.url()).toContain("/signup");
    expect(page.url()).toContain(`next=`);
    expect(page.url()).toContain(`/join/${code}`);
  });
});
