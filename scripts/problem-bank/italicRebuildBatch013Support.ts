import { italicRebuildBatch013Fixtures } from "../../src/content/batches/italicRebuildBatch013Fixtures"
import { italicRebuildBatch013Problems } from "../../src/content/batches/italicRebuildBatch013Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const ITALIC_REBUILD_BATCH_013_ID =
  "2026-07-20-l1-italic-l2-rebuilds-013"

export const italicRebuildBatch013Config = {
  batchId: ITALIC_REBUILD_BATCH_013_ID,
  sequence: 13,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildItalicRebuildBatch013Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: italicRebuildBatch013Config,
    problems: italicRebuildBatch013Problems,
    fixtures: italicRebuildBatch013Fixtures,
  })
}

export function writeItalicRebuildBatch013Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildItalicRebuildBatch013Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedItalicRebuildBatch013({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: italicRebuildBatch013Config,
  })
}

export function checkItalicRebuildBatch013State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildItalicRebuildBatch013Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedItalicRebuildBatch013>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildItalicRebuildBatch013Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildItalicRebuildBatch013Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedItalicRebuildBatch013>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishItalicRebuildBatch013Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildItalicRebuildBatch013Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
