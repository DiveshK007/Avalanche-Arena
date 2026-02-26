import { test, expect } from "@playwright/test";

/**
 * Arena E2E Tests — Navigation & Layout
 */

test.describe("Navigation", () => {
  test("should show navbar on all pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByText("Arena")).toBeVisible();
  });

  test("should have working nav links", async ({ page }) => {
    await page.goto("/");

    // Navigate to each page
    const links = ["Dashboard", "Quests", "Leaderboard", "Achievements"];

    for (const link of links) {
      await page.getByRole("link", { name: link }).first().click();
      await expect(page).toHaveURL(new RegExp(link.toLowerCase()));
    }
  });

  test("should show connect wallet button", async ({ page }) => {
    await page.goto("/");

    // RainbowKit renders a connect button
    await expect(page.getByText(/connect/i).first()).toBeVisible();
  });

  test("should show theme toggle", async ({ page }) => {
    await page.goto("/");

    // Theme toggle should be visible
    const toggle = page.locator("button").filter({ hasText: /🌙|☀️/ });
    await expect(toggle).toBeVisible();
  });
});

test.describe("Quests Page", () => {
  test("should render quest filters", async ({ page }) => {
    await page.goto("/quests");

    await expect(page.getByText("Quest Feed")).toBeVisible();

    // Difficulty filters
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Easy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hard" })).toBeVisible();
  });

  test("should filter quests by difficulty", async ({ page }) => {
    await page.goto("/quests");

    // Click a difficulty filter
    await page.getByRole("button", { name: "Easy" }).click();

    // Filter should be highlighted
    const easyBtn = page.getByRole("button", { name: "Easy" });
    await expect(easyBtn).toHaveClass(/bg-arena-accent/);
  });
});

test.describe("Leaderboard Page", () => {
  test("should render leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByText(/leaderboard/i).first()).toBeVisible();
  });
});

test.describe("Achievements Page", () => {
  test("should render achievements page", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.getByText(/achievement/i).first()).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should be usable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Hero should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Navigation should exist (may be in hamburger menu)
    await expect(page.locator("nav")).toBeVisible();
  });
});
