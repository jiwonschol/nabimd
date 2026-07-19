import { thematicBreakBatch009Fixtures } from "../../src/content/batches/thematicBreakBatch009Fixtures"
import { thematicBreakBatch009Problems } from "../../src/content/batches/thematicBreakBatch009Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const THEMATIC_BREAK_BATCH_009_ID =
  "2026-07-19-l1-l2-thematic-breaks-009"

export const thematicBreakBatch009Config = {
  batchId: THEMATIC_BREAK_BATCH_009_ID,
  sequence: 9,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildThematicBreakBatch009Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: thematicBreakBatch009Config,
    problems: thematicBreakBatch009Problems,
    fixtures: thematicBreakBatch009Fixtures,
  })
}

export function writeThematicBreakBatch009Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildThematicBreakBatch009Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedThematicBreakBatch009({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: thematicBreakBatch009Config,
  })
}

export function checkThematicBreakBatch009State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildThematicBreakBatch009Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedThematicBreakBatch009>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildThematicBreakBatch009Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildThematicBreakBatch009Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedThematicBreakBatch009>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishThematicBreakBatch009Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildThematicBreakBatch009Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
