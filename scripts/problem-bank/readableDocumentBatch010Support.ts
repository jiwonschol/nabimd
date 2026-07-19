import { readableDocumentBatch010Fixtures } from "../../src/content/batches/readableDocumentBatch010Fixtures"
import { readableDocumentBatch010Problems } from "../../src/content/batches/readableDocumentBatch010Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const READABLE_DOCUMENT_BATCH_010_ID =
  "2026-07-19-l3-readable-documents-010"

export const readableDocumentBatch010Config = {
  batchId: READABLE_DOCUMENT_BATCH_010_ID,
  sequence: 10,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildReadableDocumentBatch010Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: readableDocumentBatch010Config,
    problems: readableDocumentBatch010Problems,
    fixtures: readableDocumentBatch010Fixtures,
  })
}

export function writeReadableDocumentBatch010Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch010Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedReadableDocumentBatch010({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: readableDocumentBatch010Config,
  })
}

export function checkReadableDocumentBatch010State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch010Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedReadableDocumentBatch010>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildReadableDocumentBatch010Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch010Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedReadableDocumentBatch010>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishReadableDocumentBatch010Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildReadableDocumentBatch010Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
