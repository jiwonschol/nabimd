import { pathToFileURL } from "node:url"
import { levelUnlockBatch047Fixtures } from "../../src/content/batches/levelUnlockBatch047Fixtures"
import { levelUnlockBatch047Id, levelUnlockBatch047Problems } from "../../src/content/batches/levelUnlockBatch047Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch047Config = {
  batchId: levelUnlockBatch047Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch047Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch047Config, problems: levelUnlockBatch047Problems, fixtures: levelUnlockBatch047Fixtures })
}

export function writeLevelUnlockBatch047Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch047Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch047({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch047Config })
}

export function checkLevelUnlockBatch047State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch047Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch047>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch047Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch047Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch047>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch047Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch047Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch047Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch047Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch047Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch047Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
