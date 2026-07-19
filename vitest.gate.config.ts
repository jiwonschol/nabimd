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
      "scripts/problem-bank/inlineCodeBatch007Artifacts.gate.ts",
      "scripts/problem-bank/linkBatch008Artifacts.gate.ts",
      "scripts/problem-bank/thematicBreakBatch009Artifacts.gate.ts",
      "scripts/problem-bank/readableDocumentBatch010Artifacts.gate.ts",
      "scripts/problem-bank/readableDocumentBatch011Artifacts.gate.ts",
      "scripts/problem-bank/developmentSpecBatch012Artifacts.gate.ts",
      "scripts/problem-bank/italicRebuildBatch013Artifacts.gate.ts",
      "scripts/problem-bank/codeBlockBatch014Artifacts.gate.ts",
      "scripts/problem-bank/headingDepthBatch015Artifacts.gate.ts",
      "scripts/problem-bank/nestedListBatch016Artifacts.gate.ts",
      "scripts/problem-bank/advancedDocumentBatch017Artifacts.gate.ts",
    ],
  },
})
