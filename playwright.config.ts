import { defineConfig, devices } from "@playwright/test"

const deploymentUrl = process.env.E2E_BASE_URL?.trim() || undefined
const localPort = process.env.E2E_PORT?.trim() || "4174"
const localUrl = `http://127.0.0.1:${localPort}`

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
        command: `npm run dev -- --host 127.0.0.1 --port ${localPort}`,
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
