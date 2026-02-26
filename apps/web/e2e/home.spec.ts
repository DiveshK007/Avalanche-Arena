import { test, expect } from "@playwright/test";

/**
 * Arena E2E Tests — Home Page
 */

test.describe("Home Page", () => {
  test("should render hero section", async ({ page }) => {
    await page.goto("/");

    // Check hero heading
    await expect(page.locator("h1")).toContainText("Your Wallet Is Your");
    await expect(page.locator("h1")).toContainText("Character");

    // Check CTA buttons
    await expect(page.getByRole("link", { name: "Enter Arena" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Quests" })).toBeVisible();
  });

  test("should render How It Works section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("How It Works")).toBeVisible();
    await expect(page.getByText("Play Games")).toBeVisible();
    await expect(page.getByText("Verified On-Chain")).toBeVisible();
    await expect(page.getByText("Earn XP & Level Up")).toBeVisible();
    await expect(page.getByText("Evolve Identity")).toBeVisible();
  });

  test("should navigate to quests page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Browse Quests" }).click();
    await expect(page).toHaveURL("/quests");
    await expect(page.getByText("Quest Feed")).toBeVisible();
  });

  test("should navigate to dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Enter Arena" }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
