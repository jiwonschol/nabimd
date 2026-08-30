import { pathToFileURL } from "node:url"
import { levelUnlockBatch032Fixtures } from "../../src/content/batches/levelUnlockBatch032Fixtures"
import { levelUnlockBatch032Id, levelUnlockBatch032Problems } from "../../src/content/batches/levelUnlockBatch032Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch032Config = {
  batchId: levelUnlockBatch032Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-30",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch032Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch032Config, problems: levelUnlockBatch032Problems, fixtures: levelUnlockBatch032Fixtures })
}

export function writeLevelUnlockBatch032Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch032Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch032({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch032Config })
}

export function checkLevelUnlockBatch032State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch032Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch032>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch032Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch032Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch032>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch032Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch032Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch032Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch032Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch032Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch032Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
