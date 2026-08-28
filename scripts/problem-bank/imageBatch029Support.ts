import { pathToFileURL } from "node:url"
import { imageBatch029Fixtures } from "../../src/content/batches/imageBatch029Fixtures"
import {
  imageBatch029Id,
  imageBatch029Problems,
} from "../../src/content/batches/imageBatch029Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch029Config = {
  batchId: imageBatch029Id,
  sequence: 25,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch029Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch029Config,
    problems: imageBatch029Problems,
    fixtures: imageBatch029Fixtures,
  })
}

export function writeImageBatch029Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch029Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch029({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch029Config,
  })
}

export function checkImageBatch029State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch029Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch029>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch029Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch029Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch029>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch029Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch029Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch029Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch029Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch029Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch029Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
