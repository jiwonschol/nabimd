import { pathToFileURL } from "node:url"
import { levelUnlockBatch049Fixtures } from "../../src/content/batches/levelUnlockBatch049Fixtures"
import { levelUnlockBatch049Id, levelUnlockBatch049Problems } from "../../src/content/batches/levelUnlockBatch049Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch049Config = {
  batchId: levelUnlockBatch049Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch048Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch049Config, problems: levelUnlockBatch049Problems, fixtures: levelUnlockBatch049Fixtures })
}

export function writeLevelUnlockBatch048Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch048Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch048({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch049Config })
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
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch049Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch048Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch048Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch048Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
