import { defineConfig, devices } from "@playwright/test"

const deploymentUrl = process.env.E2E_BASE_URL?.trim() || undefined
const localUrl = "http://127.0.0.1:4173"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: deploymentUrl ?? localUrl,
    trace: "retain-on-failure",
  },
  webServer: deploymentUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        url: localUrl,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
