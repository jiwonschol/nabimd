import { pathToFileURL } from "node:url"
import { imageBatch025Fixtures } from "../../src/content/batches/imageBatch025Fixtures"
import {
  imageBatch025Id,
  imageBatch025Problems,
} from "../../src/content/batches/imageBatch025Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch025Config = {
  batchId: imageBatch025Id,
  sequence: 23,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch025Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch025Config,
    problems: imageBatch025Problems,
    fixtures: imageBatch025Fixtures,
  })
}

export function writeImageBatch025Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch025Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch025({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch025Config,
  })
}

export function checkImageBatch025State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch025Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch025>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch025Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch025Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch025>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch025Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch025Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch025Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch025Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch025Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch025Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
