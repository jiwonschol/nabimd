import { pathToFileURL } from "node:url"
import { nestedBulletBatch019Fixtures } from "../../src/content/batches/nestedBulletBatch019Fixtures"
import {
  nestedBulletBatch019Id,
  nestedBulletBatch019Problems,
} from "../../src/content/batches/nestedBulletBatch019Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const nestedBulletBatch019Config = {
  batchId: nestedBulletBatch019Id,
  sequence: 19,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-22",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildNestedBulletBatch019Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: nestedBulletBatch019Config,
    problems: nestedBulletBatch019Problems,
    fixtures: nestedBulletBatch019Fixtures,
  })
}

export function writeNestedBulletBatch019Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildNestedBulletBatch019Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedNestedBulletBatch019({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: nestedBulletBatch019Config,
  })
}

export function checkNestedBulletBatch019State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildNestedBulletBatch019Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedNestedBulletBatch019>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildNestedBulletBatch019Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildNestedBulletBatch019Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedNestedBulletBatch019>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishNestedBulletBatch019Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildNestedBulletBatch019Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: nestedBulletBatch019Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildNestedBulletBatch019Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeNestedBulletBatch019Artifacts({ repositoryRoot, computed })
    return
  }
  await publishNestedBulletBatch019Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
