import { pathToFileURL } from "node:url"
import { imageBatch023Fixtures } from "../../src/content/batches/imageBatch023Fixtures"
import {
  imageBatch023Id,
  imageBatch023Problems,
} from "../../src/content/batches/imageBatch023Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const imageBatch023Config = {
  batchId: imageBatch023Id,
  sequence: 23,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-08-28",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildImageBatch023Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: imageBatch023Config,
    problems: imageBatch023Problems,
    fixtures: imageBatch023Fixtures,
  })
}

export function writeImageBatch023Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch023Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedImageBatch023({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: imageBatch023Config,
  })
}

export function checkImageBatch023State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch023Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch023>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildImageBatch023Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildImageBatch023Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedImageBatch023>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishImageBatch023Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildImageBatch023Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: imageBatch023Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildImageBatch023Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeImageBatch023Artifacts({ repositoryRoot, computed })
    return
  }
  await publishImageBatch023Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
