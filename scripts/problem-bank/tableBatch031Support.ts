import { pathToFileURL } from "node:url"
import { tableBatch031Fixtures } from "../../src/content/batches/tableBatch031Fixtures"
import {
  tableBatch031Id,
  tableBatch031Problems,
} from "../../src/content/batches/tableBatch031Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const tableBatch031Config = {
  batchId: tableBatch031Id,
  sequence: 27,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-29",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildTableBatch031Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: tableBatch031Config,
    problems: tableBatch031Problems,
    fixtures: tableBatch031Fixtures,
  })
}

export function writeTableBatch031Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildTableBatch031Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedTableBatch031({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: tableBatch031Config,
  })
}

export function checkTableBatch031State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildTableBatch031Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedTableBatch031>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildTableBatch031Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildTableBatch031Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedTableBatch031>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishTableBatch031Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildTableBatch031Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: tableBatch031Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildTableBatch031Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeTableBatch031Artifacts({ repositoryRoot, computed })
    return
  }
  await publishTableBatch031Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
