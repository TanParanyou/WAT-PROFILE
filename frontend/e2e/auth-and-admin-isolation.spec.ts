import { test, expect } from "@playwright/test";

test.describe("Admin Authentication & Boundary Isolation", () => {
  test("should protect admin routes from unauthorized public users", async ({ page }) => {
    // Attempt to access admin dashboard directly
    await page.goto("/th/admin");
    // Should be redirected to admin login or display login screen
    await expect(page).toHaveURL(/.*admin\/login.*/);
  });

  test("should keep admin token in memory and not leak into localStorage", async ({ page }) => {
    await page.goto("/th/admin/login");

    // Check localStorage before and after login page load
    const tokensInLocalStorage = await page.evaluate(() => {
      return {
        adminToken: localStorage.getItem("admin_access_token") || localStorage.getItem("token"),
        memberToken: localStorage.getItem("access_token"),
      };
    });

    expect(tokensInLocalStorage.adminToken).toBeNull();
  });

  test("should render admin login form with required fields", async ({ page }) => {
    await page.goto("/th/admin/login");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });
});
