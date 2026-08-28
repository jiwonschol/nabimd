import { pathToFileURL } from "node:url"
import { imageBatch027Fixtures } from "../../src/content/batches/imageBatch027Fixtures"
import {
  imageBatch027Id,
  imageBatch027Problems,
} from "../../src/content/batches/imageBatch027Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch027Config = {
  batchId: imageBatch027Id,
  sequence: 23,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch027Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch027Config,
    problems: imageBatch027Problems,
    fixtures: imageBatch027Fixtures,
  })
}

export function writeImageBatch027Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch027Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch027({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch027Config,
  })
}

export function checkImageBatch027State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch027Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch027>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch027Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch027Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch027>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch027Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch027Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch027Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch027Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch027Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch027Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
