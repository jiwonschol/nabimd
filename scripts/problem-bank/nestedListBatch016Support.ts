import { pathToFileURL } from "node:url"
import { nestedListBatch016Fixtures } from "../../src/content/batches/nestedListBatch016Fixtures"
import { nestedListBatch016Problems } from "../../src/content/batches/nestedListBatch016Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const NESTED_LIST_BATCH_016_ID =
  "2026-07-20-l2-nested-list-documents-016"

export const nestedListBatch016Config = {
  batchId: NESTED_LIST_BATCH_016_ID,
  sequence: 16,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildNestedListBatch016Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: nestedListBatch016Config,
    problems: nestedListBatch016Problems,
    fixtures: nestedListBatch016Fixtures,
  })
}

export function writeNestedListBatch016Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildNestedListBatch016Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedNestedListBatch016({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: nestedListBatch016Config,
  })
}

export function checkNestedListBatch016State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildNestedListBatch016Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedNestedListBatch016>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildNestedListBatch016Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildNestedListBatch016Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedNestedListBatch016>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishNestedListBatch016Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildNestedListBatch016Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: nestedListBatch016Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildNestedListBatch016Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeNestedListBatch016Artifacts({ repositoryRoot, computed })
    return
  }
  await publishNestedListBatch016Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
