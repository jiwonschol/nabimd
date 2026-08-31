import { pathToFileURL } from "node:url"
import { levelUnlockBatch051Fixtures } from "../../src/content/batches/levelUnlockBatch051Fixtures"
import { levelUnlockBatch051Id, levelUnlockBatch051Problems } from "../../src/content/batches/levelUnlockBatch051Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const levelUnlockBatch051Config = {
  batchId: levelUnlockBatch051Id,
  sequence: 28,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-sol-build-time-authoring",
  generatedOn: "2026-08-31",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLevelUnlockBatch051Artifacts({ repositoryRoot }: { repositoryRoot: string }) {
  return buildAuthoredBatchArtifacts({ repositoryRoot, config: levelUnlockBatch051Config, problems: levelUnlockBatch051Problems, fixtures: levelUnlockBatch051Fixtures })
}

export function writeLevelUnlockBatch051Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch051Artifacts>> }) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLevelUnlockBatch051({ repositoryRoot }: { repositoryRoot: string }) {
  return readCommittedAuthoredBatch({ repositoryRoot, config: levelUnlockBatch051Config })
}

export function checkLevelUnlockBatch051State({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch051Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch051>> }) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLevelUnlockBatch051Publication({ computed, committed }: { computed: Awaited<ReturnType<typeof buildLevelUnlockBatch051Artifacts>>; committed: Awaited<ReturnType<typeof readCommittedLevelUnlockBatch051>> }) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLevelUnlockBatch051Artifacts({ repositoryRoot, computed }: { repositoryRoot: string; computed: Awaited<ReturnType<typeof buildLevelUnlockBatch051Artifacts>> }) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") throw new Error("Usage: levelUnlockBatch051Support.ts <prepare|publish>")
  const repositoryRoot = process.cwd()
  const computed = await buildLevelUnlockBatch051Artifacts({ repositoryRoot })
  if (action === "prepare") return writeLevelUnlockBatch051Artifacts({ repositoryRoot, computed })
  return publishLevelUnlockBatch051Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) await main()
