import { pathToFileURL } from "node:url"
import { advancedDocumentReplacementBatch018Fixtures } from "../../src/content/batches/advancedDocumentReplacementBatch018Fixtures"
import {
  advancedDocumentReplacementBatch018Id,
  advancedDocumentReplacementBatch018Problems,
} from "../../src/content/batches/advancedDocumentReplacementBatch018Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const advancedDocumentReplacementBatch018Config = {
  batchId: advancedDocumentReplacementBatch018Id,
  sequence: 18,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-22",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildAdvancedDocumentReplacementBatch018Artifacts({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: advancedDocumentReplacementBatch018Config,
    problems: advancedDocumentReplacementBatch018Problems,
    fixtures: advancedDocumentReplacementBatch018Fixtures,
  })
}

export function writeAdvancedDocumentReplacementBatch018Artifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<
    ReturnType<typeof buildAdvancedDocumentReplacementBatch018Artifacts>
  >
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedAdvancedDocumentReplacementBatch018({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: advancedDocumentReplacementBatch018Config,
  })
}

export function checkAdvancedDocumentReplacementBatch018State({
  computed,
  committed,
}: {
  computed: Awaited<
    ReturnType<typeof buildAdvancedDocumentReplacementBatch018Artifacts>
  >
  committed: Awaited<
    ReturnType<typeof readCommittedAdvancedDocumentReplacementBatch018>
  >
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildAdvancedDocumentReplacementBatch018Publication({
  computed,
  committed,
}: {
  computed: Awaited<
    ReturnType<typeof buildAdvancedDocumentReplacementBatch018Artifacts>
  >
  committed: Awaited<
    ReturnType<typeof readCommittedAdvancedDocumentReplacementBatch018>
  >
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishAdvancedDocumentReplacementBatch018Artifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<
    ReturnType<typeof buildAdvancedDocumentReplacementBatch018Artifacts>
  >
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error(
      "Usage: advancedDocumentReplacementBatch018Support.ts <prepare|publish>",
    )
  }
  const repositoryRoot = process.cwd()
  const computed = await buildAdvancedDocumentReplacementBatch018Artifacts({
    repositoryRoot,
  })
  if (action === "prepare") {
    await writeAdvancedDocumentReplacementBatch018Artifacts({
      repositoryRoot,
      computed,
    })
    return
  }
  await publishAdvancedDocumentReplacementBatch018Artifacts({
    repositoryRoot,
    computed,
  })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
