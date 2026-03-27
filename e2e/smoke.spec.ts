import { test, expect } from "@playwright/test";

test.describe("static smoke", () => {
  test("verify and passport pages load", async ({ page }) => {
    const verify = await page.goto("/web/verify.html");
    expect(verify?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /verify/i })).toBeVisible();

    const passport = await page.goto("/web/passport.html");
    expect(passport?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
});
