import type { SyntaxCheckpoint } from "../guided/guidedSyntax"
import {
  instructionFor,
  type CheckpointInstruction,
} from "../guided/checkpointInstruction"
import { checkpointShape } from "../guided/checkpointShape"

/*
 * The card drill this file used to render is gone (plan §3.8). Only the
 * sentence helper stays, because the sealed batch tests in
 * src/content/batches import it from this path and that folder is not
 * touched by the redesign.
 */

export type { CheckpointInstruction } from "../guided/checkpointInstruction"

/**
 * The sentence above the boxes.
 *
 * The judgment lives in `instructionFor`, which takes a shape and cannot see
 * `canonicalInput`. Every blank joined with nothing between them cannot tell
 * one mark from several, and nine defects came from deciding the sentence
 * from that value; keeping the checkpoint on this side of the call is what
 * stops the next branch from reaching for it again.
 */
export function describeCheckpoint(
  checkpoint: SyntaxCheckpoint,
): CheckpointInstruction {
  return instructionFor(checkpointShape(checkpoint))
}
