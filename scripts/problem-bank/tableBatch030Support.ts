import { pathToFileURL } from "node:url"
import { tableBatch030Fixtures } from "../../src/content/batches/tableBatch030Fixtures"
import {
  tableBatch030Id,
  tableBatch030Problems,
} from "../../src/content/batches/tableBatch030Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const tableBatch030Config = {
  batchId: tableBatch030Id,
  sequence: 26,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-29",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildTableBatch030Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: tableBatch030Config,
    problems: tableBatch030Problems,
    fixtures: tableBatch030Fixtures,
  })
}

export function writeTableBatch030Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildTableBatch030Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedTableBatch030({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: tableBatch030Config,
  })
}

export function checkTableBatch030State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildTableBatch030Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedTableBatch030>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildTableBatch030Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildTableBatch030Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedTableBatch030>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishTableBatch030Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildTableBatch030Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: tableBatch030Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildTableBatch030Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeTableBatch030Artifacts({ repositoryRoot, computed })
    return
  }
  await publishTableBatch030Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
