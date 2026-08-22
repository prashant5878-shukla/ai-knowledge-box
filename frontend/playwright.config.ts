import { defineConfig } from "@playwright/test";

// Not a CI/regression suite — see tests/visual/README.md. Used to capture full-page
// screenshots of the running app as a design reference, driven from the CLI
// (`npx playwright test`), with output written to tests/visual/screenshots/.
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
