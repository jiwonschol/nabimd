import { defineConfig, devices } from "@playwright/test"

const deploymentUrl = process.env.E2E_BASE_URL?.trim() || undefined
const configuredPort = process.env.E2E_PORT?.trim()
const localPort = configuredPort ? Number(configuredPort) : 4174
if (!Number.isInteger(localPort) || localPort < 1 || localPort > 65_535) {
  throw new Error("E2E_PORT must be an integer between 1 and 65535")
}
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
