import { readableDocumentBatch011Fixtures } from "../../src/content/batches/readableDocumentBatch011Fixtures"
import {
  readableDocumentBatch011Id,
  readableDocumentBatch011Problems,
} from "../../src/content/batches/readableDocumentBatch011Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const readableDocumentBatch011Config = {
  batchId: readableDocumentBatch011Id,
  sequence: 11,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildReadableDocumentBatch011Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: readableDocumentBatch011Config,
    problems: readableDocumentBatch011Problems,
    fixtures: readableDocumentBatch011Fixtures,
  })
}

export function writeReadableDocumentBatch011Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch011Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedReadableDocumentBatch011({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: readableDocumentBatch011Config,
  })
}

export function checkReadableDocumentBatch011State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch011Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedReadableDocumentBatch011>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildReadableDocumentBatch011Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch011Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedReadableDocumentBatch011>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishReadableDocumentBatch011Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch011Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
