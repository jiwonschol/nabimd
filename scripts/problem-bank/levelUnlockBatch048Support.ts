import { pathToFileURL } from "node:url"
import { levelUnlockBatch048Fixtures } from "../../src/content/batches/levelUnlockBatch048Fixtures"
import { levelUnlockBatch048Id, levelUnlockBatch048Problems } from "../../src/content/batches/levelUnlockBatch048Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch048Config = {
  batchId: levelUnlockBatch048Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch048Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch048Config, problems: levelUnlockBatch048Problems, fixtures: levelUnlockBatch048Fixtures })
}

export function writeLevelUnlockBatch048Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch048Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch048({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch048Config })
}

export function checkLevelUnlockBatch048State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch048Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch048>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch048Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch048Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch048>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch048Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch048Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch048Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch048Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch048Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch048Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
