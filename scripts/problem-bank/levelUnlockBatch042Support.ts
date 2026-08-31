import { pathToFileURL } from "node:url"
import { levelUnlockBatch042Fixtures } from "../../src/content/batches/levelUnlockBatch042Fixtures"
import { levelUnlockBatch042Id, levelUnlockBatch042Problems } from "../../src/content/batches/levelUnlockBatch042Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch042Config = {
  batchId: levelUnlockBatch042Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch042Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch042Config, problems: levelUnlockBatch042Problems, fixtures: levelUnlockBatch042Fixtures })
}

export function writeLevelUnlockBatch042Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch042Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch042({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch042Config })
}

export function checkLevelUnlockBatch042State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch042Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch042>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch042Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch042Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch042>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch042Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch042Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch042Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch042Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch042Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch042Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
