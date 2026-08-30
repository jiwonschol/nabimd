import { pathToFileURL } from "node:url"
import { levelUnlockBatch034Fixtures } from "../../src/content/batches/levelUnlockBatch034Fixtures"
import { levelUnlockBatch034Id, levelUnlockBatch034Problems } from "../../src/content/batches/levelUnlockBatch034Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch034Config = {
  batchId: levelUnlockBatch034Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch034Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch034Config, problems: levelUnlockBatch034Problems, fixtures: levelUnlockBatch034Fixtures })
}

export function writeLevelUnlockBatch034Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch034Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch034({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch034Config })
}

export function checkLevelUnlockBatch034State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch034Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch034>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch034Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch034Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch034>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch034Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch034Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch034Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch034Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch034Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch034Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
