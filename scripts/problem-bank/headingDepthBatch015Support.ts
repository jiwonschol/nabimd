import { pathToFileURL } from "node:url"
import { headingDepthBatch015Fixtures } from "../../src/content/batches/headingDepthBatch015Fixtures"
import { headingDepthBatch015Problems } from "../../src/content/batches/headingDepthBatch015Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const HEADING_DEPTH_BATCH_015_ID =
  "2026-07-20-l1-heading-depth-l2-sectioned-documents-015"

export const headingDepthBatch015Config = {
  batchId: HEADING_DEPTH_BATCH_015_ID,
  sequence: 15,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildHeadingDepthBatch015Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: headingDepthBatch015Config,
    problems: headingDepthBatch015Problems,
    fixtures: headingDepthBatch015Fixtures,
  })
}

export function writeHeadingDepthBatch015Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildHeadingDepthBatch015Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedHeadingDepthBatch015({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: headingDepthBatch015Config,
  })
}

export function checkHeadingDepthBatch015State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildHeadingDepthBatch015Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedHeadingDepthBatch015>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildHeadingDepthBatch015Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildHeadingDepthBatch015Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedHeadingDepthBatch015>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishHeadingDepthBatch015Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildHeadingDepthBatch015Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: headingDepthBatch015Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildHeadingDepthBatch015Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeHeadingDepthBatch015Artifacts({ repositoryRoot, computed })
    return
  }
  await publishHeadingDepthBatch015Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
