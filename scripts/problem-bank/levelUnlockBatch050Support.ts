import { pathToFileURL } from "node:url"
import { levelUnlockBatch050Fixtures } from "../../src/content/batches/levelUnlockBatch050Fixtures"
import { levelUnlockBatch050Id, levelUnlockBatch050Problems } from "../../src/content/batches/levelUnlockBatch050Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch050Config = {
  batchId: levelUnlockBatch050Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch050Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch050Config, problems: levelUnlockBatch050Problems, fixtures: levelUnlockBatch050Fixtures })
}

export function writeLevelUnlockBatch050Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch050Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch050({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch050Config })
}

export function checkLevelUnlockBatch050State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch050Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch050>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch050Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch050Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch050>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch050Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch050Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch050Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch050Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch050Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch050Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
