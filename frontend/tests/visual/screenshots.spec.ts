import { expect, test } from "@playwright/test";
import { mockEmpty, mockPopulated } from "./fixtures";

// See tests/visual/README.md — these aren't assertions about correctness, they're a
// repeatable way to capture what the UI actually looks like, used as a design reference.
test.describe("visual reference screenshots", () => {
  test("populated desktop", async ({ page }) => {
    await mockPopulated(page);
    await page.goto("/");
    await expect(page.getByText("Saved items")).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/01-populated-desktop.png", fullPage: true });
  });

  test("empty state", async ({ page }) => {
    await mockEmpty(page);
    await page.goto("/");
    await expect(page.getByText(/Nothing saved yet/)).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/02-empty-state.png", fullPage: true });
  });

  test("query answered", async ({ page }) => {
    await mockPopulated(page);
    await page.goto("/");
    await page.getByPlaceholder("What did I save about...").fill("What am I waiting on?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(page.getByText(/billing migration/)).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/03-query-answered.png", fullPage: true });
  });

  test("digest generated with token budget", async ({ page }) => {
    await mockPopulated(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Draft" }).click();
    await expect(page.getByText(/billing migration is still waiting/i)).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/04-digest-generated.png", fullPage: true });
  });

  test("delete confirm state", async ({ page }) => {
    await mockPopulated(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Delete "Q3 roadmap notes"$/ }).click();
    await expect(page.getByText("Confirm delete?")).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/05-delete-confirm.png", fullPage: true });
  });

  test("mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPopulated(page);
    await page.goto("/");
    await expect(page.getByText("Saved items")).toBeVisible();
    await page.screenshot({ path: "tests/visual/screenshots/06-mobile.png", fullPage: true });
  });
});
