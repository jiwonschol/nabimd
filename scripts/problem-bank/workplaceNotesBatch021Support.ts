import { pathToFileURL } from "node:url"
import { workplaceNotesBatch021Fixtures } from "../../src/content/batches/workplaceNotesBatch021Fixtures"
import {
  workplaceNotesBatch021Id,
  workplaceNotesBatch021Problems,
} from "../../src/content/batches/workplaceNotesBatch021Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const workplaceNotesBatch021Config = {
  batchId: workplaceNotesBatch021Id,
  sequence: 21,
  curriculumVersion: "2026-07-19",
  generatedBy: "claude-fable-5-build-time-authoring",
  generatedOn: "2026-07-22",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildWorkplaceNotesBatch021Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: workplaceNotesBatch021Config,
    problems: workplaceNotesBatch021Problems,
    fixtures: workplaceNotesBatch021Fixtures,
  })
}

export function writeWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildWorkplaceNotesBatch021Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedWorkplaceNotesBatch021({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: workplaceNotesBatch021Config,
  })
}

export function checkWorkplaceNotesBatch021State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildWorkplaceNotesBatch021Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedWorkplaceNotesBatch021>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildWorkplaceNotesBatch021Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildWorkplaceNotesBatch021Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedWorkplaceNotesBatch021>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildWorkplaceNotesBatch021Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: workplaceNotesBatch021Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildWorkplaceNotesBatch021Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed })
    return
  }
  await publishWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
