import { pathToFileURL } from "node:url"
import { levelUnlockBatch046Fixtures } from "../../src/content/batches/levelUnlockBatch046Fixtures"
import { levelUnlockBatch046Id, levelUnlockBatch046Problems } from "../../src/content/batches/levelUnlockBatch046Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch046Config = {
  batchId: levelUnlockBatch046Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch046Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch046Config, problems: levelUnlockBatch046Problems, fixtures: levelUnlockBatch046Fixtures })
}

export function writeLevelUnlockBatch046Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch046Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch046({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch046Config })
}

export function checkLevelUnlockBatch046State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch046Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch046>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch046Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch046Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch046>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch046Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch046Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch046Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch046Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch046Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch046Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
