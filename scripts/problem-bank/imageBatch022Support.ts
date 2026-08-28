import { pathToFileURL } from "node:url"
import { imageBatch022Fixtures } from "../../src/content/batches/imageBatch022Fixtures"
import {
  imageBatch022Id,
  imageBatch022Problems,
} from "../../src/content/batches/imageBatch022Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch022Config = {
  batchId: imageBatch022Id,
  sequence: 22,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch022Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch022Config,
    problems: imageBatch022Problems,
    fixtures: imageBatch022Fixtures,
  })
}

export function writeImageBatch022Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch022Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch022({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch022Config,
  })
}

export function checkImageBatch022State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch022Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch022>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch022Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch022Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch022>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch022Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch022Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch022Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch022Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch022Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch022Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
