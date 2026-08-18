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
    exclude: ["scripts/problem-bank/batchPipeline.test.mjs"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
  },
})
