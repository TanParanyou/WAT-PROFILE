import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (WCAG 2.2 AA) Audits", () => {
  const publicPages = [
    { name: "Homepage (Thai)", path: "/th" },
    { name: "Homepage (English)", path: "/en" },
    { name: "Homepage (German)", path: "/de" },
    { name: "About Page", path: "/th/about" },
    { name: "Events Page", path: "/th/events" },
    { name: "Donations Page", path: "/th/donations" },
    { name: "Contact Page", path: "/th/contact" },
  ];

  for (const pageInfo of publicPages) {
    test(`should have no critical or serious a11y violations on ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const criticalAndSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(
        criticalAndSerious,
        `Expected 0 critical/serious a11y violations on ${pageInfo.path}, but found: ${JSON.stringify(
          criticalAndSerious.map((v) => ({ id: v.id, impact: v.impact, description: v.description })),
          null,
          2
        )}`
      ).toEqual([]);
    });
  }
});
