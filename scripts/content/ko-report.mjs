#!/usr/bin/env node
// 한국어 문제은행 v1 보고서(이슈 #253). 실행: node --import tsx scripts/content/ko-report.mjs
// 기호별 장 수, 픽스처 통과율, target 중복, 줄 길이, 금칙, 해요체를 표로 찍는다.
// 실패가 하나라도 있으면 종료 코드 1로 끝난다.
import { evaluateProblem } from "../../src/engine/evaluateProblem.ts"
import { KO_MARKS, koCards, koCardsByMark, koMixedCards, markName } from "../../src/content/ko/index.ts"
import { koFixtures } from "../../src/content/ko/fixtures.ts"
import { KO_LIMITS, lintKoCard } from "../../src/content/ko/lint.ts"

const problemsById = new Map(koCards.map((card) => [card.problem.id, card.problem]))

function fixtureOutcome(fixture) {
  const evaluation = evaluateProblem(problemsById.get(fixture.problemId), fixture.source)
  if (evaluation.status !== fixture.expectedStatus) return false
  if (evaluation.status === "fail") return evaluation.feedbackId === fixture.expectedFeedbackId
  const reviews = evaluation.reviewItems.map((item) => item.id)
  return JSON.stringify(reviews) === JSON.stringify(fixture.expectedReviewIds ?? [])
}

function groupRow(label, cards) {
  const ids = new Set(cards.map((card) => card.problem.id))
  const fixtures = koFixtures.filter((fixture) => ids.has(fixture.problemId))
  const passed = fixtures.filter(fixtureOutcome)
  const issues = cards.flatMap(lintKoCard)
  const longest = Math.max(0, ...cards.flatMap((card) => card.problem.target.split("\n").map((line) => line.length)))
  const largest = Math.max(0, ...cards.map((card) => card.problem.target.length))
  return {
    label,
    cards: cards.length,
    fixtures: fixtures.length,
    passed: passed.length,
    failedIds: fixtures.filter((fixture) => !passed.includes(fixture)).map((fixture) => fixture.id),
    longest,
    largest,
    length: issues.filter((issue) => issue.category === "length").length,
    forbidden: issues.filter((issue) => issue.category === "forbidden").length,
    haeyo: issues.filter((issue) => issue.category === "haeyo").length,
    style: issues.filter((issue) => issue.category === "style").length,
    issues,
  }
}

const rows = [
  ...KO_MARKS.filter((mark) => koCardsByMark[mark]).map((mark) => groupRow(markName(mark), koCardsByMark[mark])),
  ...(koMixedCards.length ? [groupRow("혼합", koMixedCards)] : []),
]
const total = groupRow("합계", koCards)

const targets = koCards.map((card) => card.problem.target)
const duplicates = targets.filter((target, index) => targets.indexOf(target) !== index)

const percent = (row) => (row.fixtures ? `${((row.passed / row.fixtures) * 100).toFixed(1)}%` : "-")
const line = (cells) => `| ${cells.join(" | ")} |`
console.log(line(["기호", "장", "픽스처", "통과", "통과율", "최장 줄", "최대 문서", "길이 위반", "금칙", "해요체", "문체"]))
console.log(line(Array(11).fill("---")))
for (const row of [...rows, total]) {
  console.log(line([row.label, row.cards, row.fixtures, row.passed, percent(row), row.longest, row.largest, row.length, row.forbidden, row.haeyo, row.style]))
}
console.log("")
console.log(`한도: ${KO_LIMITS.minLines}~${KO_LIMITS.maxLines}줄, 한 줄 ${KO_LIMITS.maxLineLength}자, 한 장 ${KO_LIMITS.maxCharacters}자`)
console.log(`target 중복: ${duplicates.length}건`)
console.log(`문서 유형: ${new Set(koCards.map((card) => card.docType)).size}가지`)

if (total.failedIds.length) {
  console.log("\n실패한 픽스처:")
  total.failedIds.forEach((id) => console.log(`- ${id}`))
}
if (total.issues.length) {
  console.log("\n규칙 위반:")
  total.issues.forEach((issue) => console.log(`- [${issue.category}] ${issue.problemId}: ${issue.detail}`))
}
if (total.failedIds.length || total.issues.length || duplicates.length) process.exitCode = 1
