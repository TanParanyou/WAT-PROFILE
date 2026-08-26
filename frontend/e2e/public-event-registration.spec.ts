import { test, expect } from "@playwright/test";

test.describe("Public Event Discovery & Registration Flow", () => {
  test("should render the calendar and events list in Thai", async ({ page }) => {
    await page.goto("/th/events");
    await page.waitForLoadState("domcontentloaded");

    // Expect page title or header
    await expect(page).toHaveTitle(/.*วัดหลวงพ่อใส.*/i);

    // Verify calendar or event list container is visible
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("should navigate across locales while preserving event view", async ({ page }) => {
    await page.goto("/th/events");
    await page.waitForLoadState("domcontentloaded");

    // Switch to English
    await page.goto("/en/events");
    await expect(page).toHaveURL(/.*\/en\/events/);

    // Switch to German
    await page.goto("/de/events");
    await expect(page).toHaveURL(/.*\/de\/events/);
  });
});
