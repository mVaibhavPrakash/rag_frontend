import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end tests.
 *
 * The tests expect:
 *   - Vite dev server running on http://localhost:8765  (started automatically)
 *   - FastAPI backend running on http://localhost:8000  (must be started manually)
 *
 * Set BACKEND_URL env var to override the backend address.
 */

const FRONTEND_URL = "http://localhost:8765";

export default defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    retries: 1,
    reporter: [["list"], ["html", { open: "never" }]],

    use: {
        baseURL: FRONTEND_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    // Start the Vite dev server before running tests.
    // The FastAPI backend must already be running on port 8000.
    webServer: {
        command: "npm run start",
        url: FRONTEND_URL,
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
