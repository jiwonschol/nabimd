import { pathToFileURL } from "node:url"
import { levelUnlockBatch043Fixtures } from "../../src/content/batches/levelUnlockBatch043Fixtures"
import { levelUnlockBatch043Id, levelUnlockBatch043Problems } from "../../src/content/batches/levelUnlockBatch043Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch043Config = {
  batchId: levelUnlockBatch043Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch043Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch043Config, problems: levelUnlockBatch043Problems, fixtures: levelUnlockBatch043Fixtures })
}

export function writeLevelUnlockBatch043Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch043Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch043({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch043Config })
}

export function checkLevelUnlockBatch043State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch043Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch043>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch043Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch043Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch043>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch043Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch043Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch043Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch043Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch043Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch043Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
