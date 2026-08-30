import { pathToFileURL } from "node:url"
import { levelUnlockBatch033Fixtures } from "../../src/content/batches/levelUnlockBatch033Fixtures"
import { levelUnlockBatch033Id, levelUnlockBatch033Problems } from "../../src/content/batches/levelUnlockBatch033Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch033Config = {
  batchId: levelUnlockBatch033Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-30",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch033Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch033Config, problems: levelUnlockBatch033Problems, fixtures: levelUnlockBatch033Fixtures })
}

export function writeLevelUnlockBatch033Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch033Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch033({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch033Config })
}

export function checkLevelUnlockBatch033State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch033Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch033>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch033Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch033Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch033>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch033Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch033Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch033Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch033Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch033Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch033Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
