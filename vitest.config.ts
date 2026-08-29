import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  // vite.config.ts supplies these to the app build; tests need them too, since
  // the error screen reports the build it crashed on.
  define: {
    __APP_VERSION__: JSON.stringify("0.0.0-test"),
    __BUILD_SHA__: JSON.stringify("0000000000000000000000000000000000000000"),
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    // `node --test` files live beside vitest ones under scripts/, and vitest
    // fails them with "No test suite found" rather than skipping them. They
    // cannot be excluded by directory — `scripts/problem-bank/pipeline.test.mjs`
    // is a vitest suite — so each is named here, and
    // `scripts/testRunnerConfig.test.mjs` fails if a new one is not.
    exclude: [
      "scripts/problem-bank/batchPipeline.test.mjs",
      "scripts/problem-bank/sealBatchEvidence.test.mjs",
    ],
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
  },
})
