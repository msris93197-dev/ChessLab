import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "e2e",
    use: { baseURL: "http://localhost:5180" },
    // Starts `npm run dev` (port 5180, see vite.config.ts) unless it is already running locally.
    webServer: { command: "npm run dev", url: "http://localhost:5180", reuseExistingServer: !process.env.CI },
});