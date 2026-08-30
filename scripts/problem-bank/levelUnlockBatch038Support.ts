import { pathToFileURL } from "node:url"
import { levelUnlockBatch038Fixtures } from "../../src/content/batches/levelUnlockBatch038Fixtures"
import { levelUnlockBatch038Id, levelUnlockBatch038Problems } from "../../src/content/batches/levelUnlockBatch038Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch038Config = {
  batchId: levelUnlockBatch038Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch038Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch038Config, problems: levelUnlockBatch038Problems, fixtures: levelUnlockBatch038Fixtures })
}

export function writeLevelUnlockBatch038Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch038Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch038({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch038Config })
}

export function checkLevelUnlockBatch038State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch038Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch038>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch038Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch038Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch038>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch038Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch038Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch038Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch038Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch038Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch038Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
