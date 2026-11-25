import { expect, test } from "@playwright/test";

// Runs against `npm run dev` (see playwright.config.ts). No backend is needed to play a game.

test("guest playing Black receives a legal engine opening move", async ({ page }) => {
    await page.goto("/play");
    await page.getByLabel("Black").check();
    await page.getByRole("button", { name: "Start game" }).click();
    const moves = page.getByRole("table", { name: "Moves" }).getByRole("button");
    await expect(moves).toHaveCount(1, { timeout: 20_000 }); // Stockfish (WASM, in a worker) moved first
    await expect(page.getByText("Black to move.")).toBeVisible();
});

test("the original minimax engine still plays", async ({ page }) => {
    await page.goto("/play");
    await page.getByLabel("Black").check();
    await page.getByLabel("Opponent").selectOption("legacy");
    await page.getByRole("button", { name: "Start game" }).click();
    await expect(page.getByRole("table", { name: "Moves" }).getByRole("button")).toHaveCount(1, { timeout: 30_000 });
});

test("deep links load the app (SPA routing)", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.getByRole("main").getByText("Methodology", { exact: true })).toBeVisible();
});
