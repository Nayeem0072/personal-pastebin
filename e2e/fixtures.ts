import { test as base, expect } from "@playwright/test";
import { AuthHelper } from "./helpers/auth";
import { PasteHelper } from "./helpers/paste";
import { OrgHelper } from "./helpers/org";

export { expect };

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

type Fixtures = {
  auth: AuthHelper;
  paste: PasteHelper;
  org: OrgHelper;
};

export const test = base.extend<Fixtures>({
  auth: async ({ page }, use) => {
    if (process.env.SERVERS_DOWN === "true") {
      test.skip(true, "Servers not running — start backend and frontend first");
      return;
    }
    await use(new AuthHelper(page));
  },
  paste: async ({ page }, use) => {
    if (process.env.SERVERS_DOWN === "true") {
      test.skip(true, "Servers not running");
      return;
    }
    await use(new PasteHelper(page));
  },
  org: async ({ page }, use) => {
    if (process.env.SERVERS_DOWN === "true") {
      test.skip(true, "Servers not running");
      return;
    }
    await use(new OrgHelper(page));
  },
});
