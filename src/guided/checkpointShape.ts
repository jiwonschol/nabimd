import type { SyntaxCheckpoint } from "./guidedSyntax"

/**
 * What a checkpoint looks like, as the instruction sentence is allowed to see
 * it.
 *
 * `SyntaxCheckpoint.canonicalInput` is every blank joined with nothing between
 * them, and the sentence used to be decided from it. That value cannot tell
 * one blank from several: `*` and `*` join to `**`, two headings of different
 * depths join to `# ##`, and `-` and `--` join to `---`. Nine separate defects
 * came from reading it, and each was patched by reaching back into `segments`
 * for the one fact the joined value had destroyed.
 *
 * So the shape carries the facts and not the value. Nothing here can be
 * concatenated back into `canonicalInput`, and `instructionFor` takes a shape
 * rather than a checkpoint, which is what keeps the joined value out of reach
 * of the next branch somebody writes.
 */
export type CheckpointShape = {
  /** Every blank the learner types, in source order. */
  readonly inputs: readonly string[]
  /** Every locked run, in source order. */
  readonly locked: readonly string[]
  /**
   * Whether blank `i` sits directly against blank `i - 1` with no locked run
   * between them. Marks that nest are adjacent; marks that merely repeat down
   * a card have the line's prose between them and join to the same value.
   */
  readonly precededByInput: readonly boolean[]
  /**
   * The locked run directly before blank `i`, or `null` when nothing is.
   *
   * A Setext underline sits under its heading text and always has one; a
   * thematic break opens its own block and does not. The two are the same
   * dashes, and this is the only thing in the source that tells them apart.
   * The *value* matters too: marks wrapping a phrase have that phrase locked
   * between them, while two breaks gathered onto one card have only the blank
   * line that separates them.
   */
  readonly lockedBefore: readonly (string | null)[]
  /** A locked run carries a line break, so the checkpoint spans lines. */
  readonly lockedBreak: boolean
}

export function checkpointShape(checkpoint: SyntaxCheckpoint): CheckpointShape {
  const inputs: string[] = []
  const locked: string[] = []
  const precededByInput: boolean[] = []
  const lockedBefore: (string | null)[] = []

  checkpoint.segments.forEach((segment, index) => {
    if (segment.kind === "locked") {
      locked.push(segment.value)
      return
    }
    inputs.push(segment.value)
    precededByInput.push(checkpoint.segments[index - 1]?.kind === "input")
    const before = checkpoint.segments[index - 1]
    lockedBefore.push(before?.kind === "locked" ? before.value : null)
  })

  return {
    inputs,
    locked,
    precededByInput,
    lockedBefore,
    lockedBreak: locked.some((value) => value.includes("\n")),
  }
}

/** How many blanks match. */
export function countInputs(shape: CheckpointShape, pattern: RegExp): number {
  return shape.inputs.filter((value) => pattern.test(value)).length
}

/**
 * Whether every blank matches, and there is at least one. `every` on an empty
 * list is true, and a checkpoint with no blanks is not any shape at all.
 */
export function everyInput(shape: CheckpointShape, pattern: RegExp): boolean {
  return shape.inputs.length > 0 && shape.inputs.every((value) => pattern.test(value))
}

/** The blanks at `index` and `index - 1`, when they touch. */
export function touchingPairAt(
  shape: CheckpointShape,
  index: number,
): readonly [string, string] | null {
  if (index <= 0 || !shape.precededByInput[index]) return null
  const first = shape.inputs[index - 1]
  const second = shape.inputs[index]
  return first === undefined || second === undefined ? null : [first, second]
}

/**
 * The first index where two touching blanks both match. Used by the shapes
 * whose meaning is nesting rather than repetition.
 */
export function firstTouchingMatch(
  shape: CheckpointShape,
  pattern: RegExp,
): number {
  return shape.inputs.findIndex((value, index) => {
    const pair = touchingPairAt(shape, index)
    return pair !== null && pattern.test(pair[0]) && pattern.test(value)
  })
}

/** Blanks that match `pattern` and sit directly behind one matching `behind`. */
export function inputsBehind(
  shape: CheckpointShape,
  pattern: RegExp,
  behind: RegExp,
): readonly string[] {
  return shape.inputs.filter((value, index) => {
    const pair = touchingPairAt(shape, index)
    return pair !== null && pattern.test(value) && behind.test(pair[0])
  })
}
