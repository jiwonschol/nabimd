import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "scripts/problem-bank/problemBankGate.gate.ts",
      "scripts/problem-bank/repositoryBankGate.gate.ts",
      "scripts/problem-bank/reviewManifest.report.ts",
      "scripts/problem-bank/seedBatchArtifacts.gate.ts",
      "scripts/problem-bank/headingBatch002Artifacts.gate.ts",
      "scripts/problem-bank/emphasisBatch003Artifacts.gate.ts",
      "scripts/problem-bank/listBatch004Artifacts.gate.ts",
      "scripts/problem-bank/orderedListBatch005Artifacts.gate.ts",
      "scripts/problem-bank/blockquoteBatch006Artifacts.gate.ts",
    ],
  },
})
