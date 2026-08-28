import type { NormalizedProblem } from "../types"
import {
  imageBatch028Inputs,
  imageBatch028Problems,
  type ImageBatch028Input,
} from "./imageBatch028Problems"

export const imageBatch029Id = "2026-08-28-l1-images-029"

export type ImageBatch029Input = ImageBatch028Input

export const imageBatch029Inputs: readonly ImageBatch029Input[] =
  imageBatch028Inputs

export const imageBatch029Problems: readonly NormalizedProblem[] =
  imageBatch028Problems.map((problem) => ({
    ...problem,
    sourceBatchId: imageBatch029Id,
    revision: 3,
  }))
