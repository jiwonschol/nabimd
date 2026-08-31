import { pathToFileURL } from "node:url"
import { levelUnlockBatch045Fixtures } from "../../src/content/batches/levelUnlockBatch045Fixtures"
import { levelUnlockBatch045Id, levelUnlockBatch045Problems } from "../../src/content/batches/levelUnlockBatch045Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch045Config = {
  batchId: levelUnlockBatch045Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch045Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch045Config, problems: levelUnlockBatch045Problems, fixtures: levelUnlockBatch045Fixtures })
}

export function writeLevelUnlockBatch045Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch045Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch045({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch045Config })
}

export function checkLevelUnlockBatch045State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch045Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch045>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch045Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch045Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch045>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch045Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch045Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch045Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch045Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch045Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch045Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
