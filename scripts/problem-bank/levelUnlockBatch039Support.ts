import { pathToFileURL } from "node:url"
import { levelUnlockBatch039Fixtures } from "../../src/content/batches/levelUnlockBatch039Fixtures"
import { levelUnlockBatch039Id, levelUnlockBatch039Problems } from "../../src/content/batches/levelUnlockBatch039Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch039Config = {
  batchId: levelUnlockBatch039Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch039Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch039Config, problems: levelUnlockBatch039Problems, fixtures: levelUnlockBatch039Fixtures })
}

export function writeLevelUnlockBatch039Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch039Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch039({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch039Config })
}

export function checkLevelUnlockBatch039State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch039Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch039>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch039Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch039Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch039>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch039Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch039Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch039Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch039Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch039Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch039Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
