import { pathToFileURL } from "node:url"
import { imageBatch028Fixtures } from "../../src/content/batches/imageBatch028Fixtures"
import {
  imageBatch028Id,
  imageBatch028Problems,
} from "../../src/content/batches/imageBatch028Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch028Config = {
  batchId: imageBatch028Id,
  sequence: 24,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch028Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch028Config,
    problems: imageBatch028Problems,
    fixtures: imageBatch028Fixtures,
  })
}

export function writeImageBatch028Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch028Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch028({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch028Config,
  })
}

export function checkImageBatch028State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch028Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch028>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch028Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch028Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch028>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch028Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch028Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch028Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch028Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch028Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch028Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
