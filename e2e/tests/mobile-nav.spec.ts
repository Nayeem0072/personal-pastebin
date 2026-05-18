import { test, expect, uid } from "../fixtures";

// These tests run on the mobile-chrome project (Pixel 5, 393px wide)
// which triggers the ≤768px mobile CSS breakpoint

test.describe("Mobile Nav", () => {
  test("logged in: mobile nav visible, sidebar hidden, 5 nav items present", async ({ auth, page }) => {
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

    // Mobile nav should be visible
    await expect(page.locator(".mobile-nav")).toBeVisible({ timeout: 5000 });

    // Desktop sidebar should be hidden
    await expect(page.locator(".app-sidebar")).not.toBeVisible();

    // Exactly 5 nav items: New, Explore, Orgs, Pastes, Logout
    const items = page.locator(".mobile-nav-item");
    await expect(items).toHaveCount(5);
  });

  test("logged out: mobile nav not visible", async ({ page }) => {
    if (process.env.SERVERS_DOWN === "true") test.skip(true, "Servers not running");

    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("auth_token"));
    await page.reload();

    // TopNav layout is shown when logged out — MobileNav is not mounted
    await expect(page.locator(".mobile-nav")).not.toBeVisible();
  });

  test("active nav item matches current route", async ({ auth, page }) => {
    const id = uid();
    const user = {
      handle: `u${id}`,
      email: `u${id}@test.pp`,
      password: "testpassword1",
      displayName: "Test User",
    };
    await auth.createAndLogin(user);

    // Navigate to /orgs
    await page.goto("/orgs");
    await page.waitForURL("**/orgs", { timeout: 10000 });

    // The Orgs nav item should have the active class
    const activeItem = page.locator(".mobile-nav-item.active");
    await expect(activeItem).toBeVisible({ timeout: 5000 });
    await expect(activeItem).toContainText("Orgs");
  });
});
