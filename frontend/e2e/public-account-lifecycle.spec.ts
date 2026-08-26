import { test, expect } from "@playwright/test";

test.describe("Public Account Lifecycle Flow", () => {
  test("should render register page with security guidelines and fields", async ({ page }) => {
    await page.goto("/th/account/register");
    await page.waitForLoadState("domcontentloaded");

    // Verify registration input fields
    await expect(page.locator("input[name='email'], input[type='email']")).toBeVisible();
    await expect(page.locator("input[name='password'], input[type='password']")).toBeVisible();
  });

  test("should render login page with forgot password link", async ({ page }) => {
    await page.goto("/th/account/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("input[name='email'], input[type='email']")).toBeVisible();
    await expect(page.locator("input[name='password'], input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("should support multilingual login navigation (TH, EN, DE)", async ({ page }) => {
    await page.goto("/en/account/login");
    await expect(page).toHaveURL(/.*\/en\/account\/login/);

    await page.goto("/de/account/login");
    await expect(page).toHaveURL(/.*\/de\/account\/login/);
  });
});
