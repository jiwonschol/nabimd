import { pathToFileURL } from "node:url"
import { levelUnlockBatch035Fixtures } from "../../src/content/batches/levelUnlockBatch035Fixtures"
import { levelUnlockBatch035Id, levelUnlockBatch035Problems } from "../../src/content/batches/levelUnlockBatch035Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch035Config = {
  batchId: levelUnlockBatch035Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch035Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch035Config, problems: levelUnlockBatch035Problems, fixtures: levelUnlockBatch035Fixtures })
}

export function writeLevelUnlockBatch035Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch035Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch035({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch035Config })
}

export function checkLevelUnlockBatch035State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch035Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch035>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch035Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch035Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch035>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch035Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch035Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch035Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch035Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch035Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch035Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
