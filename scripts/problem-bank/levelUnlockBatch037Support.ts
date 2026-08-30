import { pathToFileURL } from "node:url"
import { levelUnlockBatch037Fixtures } from "../../src/content/batches/levelUnlockBatch037Fixtures"
import { levelUnlockBatch037Id, levelUnlockBatch037Problems } from "../../src/content/batches/levelUnlockBatch037Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch037Config = {
  batchId: levelUnlockBatch037Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch037Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch037Config, problems: levelUnlockBatch037Problems, fixtures: levelUnlockBatch037Fixtures })
}

export function writeLevelUnlockBatch037Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch037Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch037({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch037Config })
}

export function checkLevelUnlockBatch037State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch037Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch037>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch037Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch037Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch037>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch037Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch037Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch037Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch037Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch037Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch037Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
