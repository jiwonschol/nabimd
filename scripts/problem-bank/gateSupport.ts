import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import headingBank from "../../src/content/generated/headingBank.generated.json"
import { headingProblems } from "../../src/content/headingProblems"
import { headingProblemFixtures } from "../../src/content/problemFixtures"
import { validateProblemBank } from "../../src/content/validateProblemBank"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import {
  canonicalJson,
  createFixtureReviewDigest,
  evaluateWorkflow,
  normalizeArtifact,
} from "./pipeline.mjs"

type JsonRecord = Record<string, unknown>

async function loadJson(path: string) {
  return JSON.parse(await readFile(path, "utf8"))
}

export async function buildGateInput() {
  const root = process.cwd()
  const bankDir = resolve(root, "curriculum/problem-bank")
  const raw = await loadJson(resolve(bankDir, "candidates.raw.json"))
  const normalized = await loadJson(resolve(bankDir, "candidates.normalized.json"))
  const prompt = await readFile(resolve(bankDir, "generation-prompt.md"), "utf8")
  const regenerated = normalizeArtifact(raw, prompt)
  const editorialQueue = await loadJson(resolve(bankDir, "editorial-queue.json"))
  const committedReviewManifest = await loadJson(
    resolve(bankDir, "review-manifest.json"),
  )
  const reviewDir = resolve(bankDir, "reviews")
  const reviewFiles = (await readdir(reviewDir)).filter((file) => file.endsWith(".json"))
  const reviews = (
    await Promise.all(reviewFiles.map((file) => loadJson(resolve(reviewDir, file))))
  ).flat()
  const fixtureDigests: Record<string, string> = {}
  const fixtureCounts: Record<string, number> = {}
  const fixtureErrors = validateProblemBank(headingProblems, headingProblemFixtures)

  for (const problem of headingProblems) {
    const candidate = normalized.candidates.find(
      (item: JsonRecord) => item.id === problem.id,
    )
    const results = headingProblemFixtures
      .filter((fixture) => fixture.problemId === problem.id)
      .sort((left, right) => left.kind.localeCompare(right.kind))
      .map((fixture) => {
        const actual = evaluateProblem(problem, fixture.source)
        if (actual.status !== fixture.expectedStatus) {
          fixtureErrors.push(
            `Fixture ${problem.id}/${fixture.kind} expected ${fixture.expectedStatus}, received ${actual.status}`,
          )
        }
        if (
          actual.status === "fail" &&
          actual.feedbackId !== fixture.expectedFeedbackId
        ) {
          fixtureErrors.push(`Fixture ${problem.id}/${fixture.kind} feedback drift`)
        }
        if (actual.status !== "fail") {
          const actualReviewIds = actual.reviewItems.map((item) => item.id)
          if (canonicalJson(actualReviewIds) !== canonicalJson(fixture.expectedReviewIds ?? [])) {
            fixtureErrors.push(`Fixture ${problem.id}/${fixture.kind} review drift`)
          }
        }
        return { fixture, actual }
      })
    fixtureDigests[problem.id] = createFixtureReviewDigest({
      candidateDigest: candidate?.candidateDigest,
      problem,
      results,
    })
    fixtureCounts[problem.id] = results.length
  }

  const runtimeHeadingBank = headingBank.map((entry) => {
    const problem = headingProblems.find((item) => item.id === entry.id)!
    return {
      id: entry.id,
      text: entry.text,
      targetMarkdown: problem.target,
      teaching: problem.teaching,
    }
  })
  const driftErrors =
    canonicalJson(normalized) === canonicalJson(regenerated)
      ? []
      : ["Normalized candidate artifact is stale"]
  const workflowErrors = evaluateWorkflow({
    normalized,
    runtimeHeadingBank,
    fixtureDigests,
    fixtureCounts,
    reviews,
    editorialQueue,
  })

  const reviewManifest = runtimeHeadingBank.map((runtime) => {
    const candidate = normalized.candidates.find(
      (item: JsonRecord) => item.id === runtime.id,
    )
    return {
      candidateId: runtime.id,
      candidateDigest: candidate?.candidateDigest,
      fixtureResultsDigest: fixtureDigests[runtime.id],
      fixtureCount: fixtureCounts[runtime.id],
    }
  })

  const reviewManifestIsCurrent =
    canonicalJson(committedReviewManifest) === canonicalJson(reviewManifest)
  if (!reviewManifestIsCurrent) {
    driftErrors.push("Committed review manifest is stale")
  }

  return {
    errors: [...driftErrors, ...fixtureErrors, ...workflowErrors],
    reviewManifest,
    reviewManifestIsCurrent,
  }
}
