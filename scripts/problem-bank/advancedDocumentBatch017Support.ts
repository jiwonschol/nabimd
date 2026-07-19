import { pathToFileURL } from "node:url"
import { advancedDocumentBatch017Fixtures } from "../../src/content/batches/advancedDocumentBatch017Fixtures"
import {
  advancedDocumentBatch017Id,
  advancedDocumentBatch017Problems,
} from "../../src/content/batches/advancedDocumentBatch017Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const advancedDocumentBatch017Config = {
  batchId: advancedDocumentBatch017Id,
  sequence: 17,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildAdvancedDocumentBatch017Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: advancedDocumentBatch017Config,
    problems: advancedDocumentBatch017Problems,
    fixtures: advancedDocumentBatch017Fixtures,
  })
}

export function writeAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildAdvancedDocumentBatch017Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedAdvancedDocumentBatch017({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: advancedDocumentBatch017Config,
  })
}

export function checkAdvancedDocumentBatch017State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildAdvancedDocumentBatch017Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedAdvancedDocumentBatch017>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildAdvancedDocumentBatch017Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildAdvancedDocumentBatch017Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedAdvancedDocumentBatch017>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildAdvancedDocumentBatch017Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: advancedDocumentBatch017Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildAdvancedDocumentBatch017Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed })
    return
  }
  await publishAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
