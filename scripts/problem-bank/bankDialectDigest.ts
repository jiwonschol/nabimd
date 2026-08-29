/**
 * Prints four digests of what the published bank turns into. It makes no
 * judgement and fails nothing — it is a measuring instrument, meant to be run
 * at two commits and compared, so a parser change can be shown to have moved
 * the existing bank or not.
 *
 * A pass/fail test with the digests pinned as literals would go stale on every
 * content batch, and updating a pinned digest without re-deriving it is how a
 * regression becomes a ritual.
 *
 * This is not the proof that a parser change left the bank alone — that lives
 * in `src/markdown/parser.test.ts`, which compares both dialects inside one
 * checkout and so needs no second commit. This script is the coarser
 * instrument for the case where the trees *do* move and the question becomes
 * which downstream product moved with them.
 *
 * It cannot be run at a commit that predates it. To measure an older commit,
 * copy this file and its package.json entry into that checkout first — the
 * modules it imports have been there since long before it.
 */
import { createHash } from "node:crypto"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"
import { derivePlaintextStarter } from "../../src/content/plaintextStarter"
import { getProblem, problemBank } from "../../src/content/problemBank"

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex")

const published = Object.values(runtimeProjections.levels).flat() as {
  id: string
  target: string
}[]

const starter = digest(
  published
    .map((problem) => `${problem.id}|${derivePlaintextStarter(problem.target)}`)
    .join("\n"),
)

const checkpoints = digest(
  published
    .map((problem) => {
      const derived = deriveSyntaxCheckpoints(problem.target, "")
      const shape = derived
        .map(
          (checkpoint) =>
            `${checkpoint.line}:${checkpoint.canonicalInput}:${checkpoint.segments
              .map((segment) => `${segment.kind}=${segment.value}`)
              .join(",")}`,
        )
        .join(";")
      return `${problem.id}|${derived.length}|${shape}`
    })
    .join("\n"),
)

const verdicts = digest(
  problemBank
    .map((problem) => {
      const evaluation = evaluateProblem(getProblem(problem.id), problem.target)
      const detail =
        evaluation.status === "fail"
          ? evaluation.feedbackId
          : evaluation.reviewItems.map((item) => item.id).join(",")
      return `${problem.id}|${evaluation.status}|${detail}`
    })
    .join("\n"),
)

console.log(`published ${published.length}`)
console.log(`runtime   ${problemBank.length}`)
console.log(`starter     ${starter}`)
console.log(`checkpoints ${checkpoints}`)
console.log(`verdicts    ${verdicts}`)
