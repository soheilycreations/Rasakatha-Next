import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Automated WCAG 2 A/AA checks (includes colour contrast) on the main pages, in both themes.
const PAGES = ["/", "/categories", "/category/novel", "/book/723-eka-langata-dheka-newei", "/cart", "/checkout", "/track-order", "/about", "/contact"];

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((t) => localStorage.setItem("rasakatha:theme", t), theme);
}

for (const theme of ["dark", "light"] as const) {
  for (const path of PAGES) {
    test(`a11y ${theme} ${path}`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(1200); // let client-side content and fonts settle
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.html.slice(0, 120)}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}
