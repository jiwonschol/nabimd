import { pathToFileURL } from "node:url"
import { imageBatch026Fixtures } from "../../src/content/batches/imageBatch026Fixtures"
import {
  imageBatch026Id,
  imageBatch026Problems,
} from "../../src/content/batches/imageBatch026Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch026Config = {
  batchId: imageBatch026Id,
  sequence: 23,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch026Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch026Config,
    problems: imageBatch026Problems,
    fixtures: imageBatch026Fixtures,
  })
}

export function writeImageBatch026Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch026Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch026({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch026Config,
  })
}

export function checkImageBatch026State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch026Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch026>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch026Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch026Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch026>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch026Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch026Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch026Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch026Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch026Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch026Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
