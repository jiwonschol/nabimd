import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "scripts/problem-bank/problemBankGate.gate.ts",
      "scripts/problem-bank/reviewManifest.report.ts",
    ],
  },
})
