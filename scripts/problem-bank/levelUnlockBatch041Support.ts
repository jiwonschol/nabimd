import { pathToFileURL } from "node:url"
import { levelUnlockBatch041Fixtures } from "../../src/content/batches/levelUnlockBatch041Fixtures"
import { levelUnlockBatch041Id, levelUnlockBatch041Problems } from "../../src/content/batches/levelUnlockBatch041Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch041Config = {
  batchId: levelUnlockBatch041Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch041Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch041Config, problems: levelUnlockBatch041Problems, fixtures: levelUnlockBatch041Fixtures })
}

export function writeLevelUnlockBatch041Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch041Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch041({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch041Config })
}

export function checkLevelUnlockBatch041State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch041Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch041>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch041Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch041Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch041>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch041Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch041Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch041Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch041Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch041Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch041Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
