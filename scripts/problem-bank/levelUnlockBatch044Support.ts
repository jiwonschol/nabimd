import { pathToFileURL } from "node:url"
import { levelUnlockBatch044Fixtures } from "../../src/content/batches/levelUnlockBatch044Fixtures"
import { levelUnlockBatch044Id, levelUnlockBatch044Problems } from "../../src/content/batches/levelUnlockBatch044Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch044Config = {
  batchId: levelUnlockBatch044Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch044Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch044Config, problems: levelUnlockBatch044Problems, fixtures: levelUnlockBatch044Fixtures })
}

export function writeLevelUnlockBatch044Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch044Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch044({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch044Config })
}

export function checkLevelUnlockBatch044State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch044Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch044>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch044Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch044Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch044>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch044Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch044Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch044Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch044Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch044Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch044Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
