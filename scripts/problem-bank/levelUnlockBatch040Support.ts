import { pathToFileURL } from "node:url"
import { levelUnlockBatch040Fixtures } from "../../src/content/batches/levelUnlockBatch040Fixtures"
import { levelUnlockBatch040Id, levelUnlockBatch040Problems } from "../../src/content/batches/levelUnlockBatch040Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch040Config = {
  batchId: levelUnlockBatch040Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch040Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch040Config, problems: levelUnlockBatch040Problems, fixtures: levelUnlockBatch040Fixtures })
}

export function writeLevelUnlockBatch040Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch040Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch040({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch040Config })
}

export function checkLevelUnlockBatch040State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch040Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch040>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch040Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch040Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch040>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch040Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch040Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch040Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch040Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch040Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch040Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
