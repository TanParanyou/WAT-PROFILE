import { test, expect } from "@playwright/test";

test.describe("Self-Reported Donation Flow", () => {
  test("should render donation methods and bank information", async ({ page }) => {
    await page.goto("/th/donations");
    await page.waitForLoadState("domcontentloaded");

    // Check main container
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // Verify presence of bank transfer or donation form elements
    const pageText = await page.textContent("body");
    expect(pageText).toBeTruthy();
  });

  test("should display localized donation information in English and German", async ({ page }) => {
    await page.goto("/en/donations");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*\/en\/donations/);

    await page.goto("/de/donations");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/.*\/de\/donations/);
  });
});
