import { pathToFileURL } from "node:url"
import { levelUnlockBatch036Fixtures } from "../../src/content/batches/levelUnlockBatch036Fixtures"
import { levelUnlockBatch036Id, levelUnlockBatch036Problems } from "../../src/content/batches/levelUnlockBatch036Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch036Config = {
  batchId: levelUnlockBatch036Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch036Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch036Config, problems: levelUnlockBatch036Problems, fixtures: levelUnlockBatch036Fixtures })
}

export function writeLevelUnlockBatch036Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch036Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch036({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch036Config })
}

export function checkLevelUnlockBatch036State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch036Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch036>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch036Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch036Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch036>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch036Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch036Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch036Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch036Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch036Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch036Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
