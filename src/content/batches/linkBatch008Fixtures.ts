import type { FixtureRole, ProblemFixture } from "../types"
import { linkBatch008Problems } from "./linkBatch008Problems"

function fixtureKind(role: FixtureRole): ProblemFixture["kind"] {
  switch (role) {
    case "canonical":
      return "canonical"
    case "different-prose":
      return "alternate"
    case "case-spelling-variation":
      return "case-variation"
    case "missing":
      return "missing"
    case "malformed":
      return "malformed"
    case "matched-with-review":
      return "matched-with-refinement"
    case "edge-case":
      return "normalized-whitespace"
  }
}

function createLinkFixtures(
  problem: (typeof linkBatch008Problems)[number],
  index: number,
): ProblemFixture[] {
  const alternate = `different label ${index + 1}`
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: "use-link",
    exercisesCheckId: "use-link",
  }
  const fixtures: readonly {
    role: FixtureRole
    kind?: ProblemFixture["kind"]
    source: string
    expectedStatus: ProblemFixture["expectedStatus"]
    expectedFeedbackId?: string
    exercisesCheckId?: string
    expectedReviewIds?: readonly string[]
  }[] = [
    { role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "different-prose", source: `Open [${alternate}](https://example.com/changed/${index + 1}).`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "case-spelling-variation", source: "Use [COMPLETELY DIFFRENT WORDS](https://changed.example/now).", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-double-title", source: '[Guide](/path "Open guide")', expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-single-title", source: "[Guide](/path 'Open guide')", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-parenthesized-title", source: "[Guide](/path (Open guide))", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-angle-destination", source: "[Guide](<folder/my file>)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-relative-destination", source: "[Guide](../guide/start)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-fragment-destination", source: "[Guide](#start)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-query-destination", source: "[Guide](?view=short)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-balanced-parentheses", source: "[Guide](https://example.com/a_(b))", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-escaped-parentheses", source: "[Guide](https://example.com/a_\\(b\\))", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-full-after", source: "[Guide][start]\n\n[start]: /path", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-full-before", source: "[start]: /path\n\n[Guide][start]", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-title", source: '[Guide][start]\n\n[start]: /path "Open guide"', expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-collapsed", source: "[Guide][]\n\n[guide]: /path", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-shortcut", source: "[Guide]\n\n[guide]: /path", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-casefold", source: "[Guide][START]\n\n[start]: /path", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-whitespace", source: "[Guide][many   words]\n\n[many words]: /path", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-emphasis-label", source: "[*Emphasized label*](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-strong-label", source: "[**Strong label**](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-inline-code-label", source: "[`code label`](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-heading", source: "# [Heading link](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-unordered-list", source: "- [List link](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-ordered-list", source: "1. [List link](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-blockquote", source: "> [Quote link](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-multiline-label", source: "[Visible\nlabel](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-escaped-label-punctuation", source: "[A \\] label](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-html-plus-visible-label", source: "[<span>Visible</span>](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-image-plus-visible-label", source: "[Docs ![logo](/logo.png)](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-entity-label", source: "[A &amp; B](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-literal-replacement-label", source: "[�](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-null-plus-visible-label", source: "[\u0000Visible](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-visible-plus-null-label", source: "[Visible\u0000](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-literal-replacement-destination", source: "[Label](�)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-null-plus-visible-destination", source: "[Label](\u0000visible)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-unsafe-javascript", source: "[Label](javascript:alert(1))", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-unsafe-data", source: "[Label](data:text/plain,hello)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-unsafe-file", source: "[Label](file:///tmp/example)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-autolink-plus-explicit", source: "<https://example.com> and [Guide](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-lookalike-plus-explicit", source: "`[fake](/no)` and [Guide](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "link-reference-first-valid-definition", source: "[Guide][ref]\n\n[ref]: /first\n[ref]: <>", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "matched-with-review", kind: "multiple-explicit-links", source: "[First](/one) and [Second](/two)", expectedStatus: "matched", expectedReviewIds: ["keep-one-link"] },
    { role: "matched-with-review", kind: "multiple-reference-links", source: "[First][a] and [Second][b]\n\n[a]: /one\n[b]: /two", expectedStatus: "matched", expectedReviewIds: ["keep-one-link"] },
    { role: "matched-with-review", kind: "multiple-mixed-links", source: "[First](/one) and [Second][b]\n\n[b]: /two", expectedStatus: "matched", expectedReviewIds: ["keep-one-link"] },
    { role: "matched-with-review", kind: "multiple-unsafe-links", source: "[First](javascript:one) and [Second](data:text/plain,two)", expectedStatus: "matched", expectedReviewIds: ["keep-one-link"] },
    { role: "missing", source: `Open ${alternate} at https://example.com.`, ...fail },
    { role: "malformed", kind: "link-missing-close-parenthesis", source: "[Label](/path", ...fail },
    { role: "edge-case", kind: "link-raw-url", source: "https://example.com/path", ...fail },
    { role: "edge-case", kind: "link-unresolved-reference", source: "[Label][missing]", ...fail },
    { role: "edge-case", kind: "link-unresolved-shortcut", source: "[Label]", ...fail },
    { role: "edge-case", kind: "link-definition-only", source: "[label]: /path", ...fail },
    { role: "edge-case", kind: "link-empty-destination", source: "[Label]()", ...fail },
    { role: "edge-case", kind: "link-empty-angle-destination", source: "[Label](<>)", ...fail },
    { role: "edge-case", kind: "link-whitespace-destination", source: "[Label](   )", ...fail },
    { role: "edge-case", kind: "link-hidden-destination", source: "[Label](\u200b\u2060)", ...fail },
    { role: "edge-case", kind: "link-control-destination", source: "[Label](\u0001\u001b\u007f)", ...fail },
    { role: "edge-case", kind: "link-null-only-destination", source: "[Label](\u0000)", ...fail },
    { role: "edge-case", kind: "link-empty-reference-destination", source: "[Label][ref]\n\n[ref]: <>", ...fail },
    { role: "edge-case", kind: "link-hidden-reference-destination", source: "[Label][ref]\n\n[ref]: \u200b\u2060", ...fail },
    { role: "edge-case", kind: "link-null-reference-destination", source: "[Label][ref]\n\n[ref]: \u0000", ...fail },
    { role: "edge-case", kind: "link-reference-first-empty-definition", source: "[Label][ref]\n\n[ref]: <>\n[ref]: /later", ...fail },
    { role: "edge-case", kind: "link-empty-label", source: "[](/path)", ...fail },
    { role: "edge-case", kind: "link-whitespace-label", source: "[   ](/path)", ...fail },
    { role: "edge-case", kind: "link-nbsp-label", source: "[\u00a0](/path)", ...fail },
    { role: "edge-case", kind: "link-ideographic-space-label", source: "[\u3000](/path)", ...fail },
    { role: "edge-case", kind: "link-zero-width-label", source: "[\u200b\u2060](/path)", ...fail },
    { role: "edge-case", kind: "link-bom-bidi-label", source: "[\ufeff\u200e\u200f](/path)", ...fail },
    { role: "edge-case", kind: "link-control-label", source: "[\u0001\u001b\u007f](/path)", ...fail },
    { role: "edge-case", kind: "link-braille-blank-label", source: "[\u2800](/path)", ...fail },
    { role: "edge-case", kind: "link-null-only-label", source: "[\u0000](/path)", ...fail },
    { role: "edge-case", kind: "link-inline-code-whitespace-label", source: "[` `](/path)", ...fail },
    { role: "edge-case", kind: "link-inline-code-hidden-label", source: "[`\u200b`](/path)", ...fail },
    { role: "edge-case", kind: "link-inline-code-null-label", source: "[`\u0000`](/path)", ...fail },
    { role: "edge-case", kind: "link-empty-reference-label", source: "[][ref]\n\n[ref]: /path", ...fail },
    { role: "edge-case", kind: "link-whitespace-reference-label", source: "[ ][ref]\n\n[ref]: /path", ...fail },
    { role: "edge-case", kind: "link-null-reference-label", source: "[\u0000][ref]\n\n[ref]: /path", ...fail },
    { role: "edge-case", kind: "link-image-only-label", source: "[![Useful alt](/image.png)](/path)", ...fail },
    { role: "edge-case", kind: "link-image-only-reference-label", source: "[![Useful alt](/image.png)][ref]\n\n[ref]: /path", ...fail },
    { role: "edge-case", kind: "link-html-only-label", source: "[<span></span>](/path)", ...fail },
    { role: "edge-case", kind: "link-comment-only-label", source: "[<!-- hidden -->](/path)", ...fail },
    { role: "edge-case", kind: "link-http-autolink", source: "<https://example.com>", ...fail },
    { role: "edge-case", kind: "link-email-autolink", source: "<person@example.com>", ...fail },
    { role: "edge-case", kind: "link-raw-html-anchor", source: '<a href="/path">Label</a>', ...fail },
    { role: "edge-case", kind: "link-standalone-image", source: "![Label](/image.png)", ...fail },
    { role: "edge-case", kind: "link-image-alt-lookalike", source: "![[Label](/path)](/image.png)", ...fail },
    { role: "edge-case", kind: "link-fenced-code-lookalike", source: "```md\n[Label](/path)\n```", ...fail },
    { role: "edge-case", kind: "link-indented-code-lookalike", source: "    [Label](/path)", ...fail },
    { role: "edge-case", kind: "link-comment-lookalike", source: "<!-- [Label](/path) -->", ...fail },
    { role: "edge-case", kind: "link-escaped-bracket", source: "\\[Label\\](/path)", ...fail },
    { role: "edge-case", kind: "link-gap-before-destination", source: "[Label] (/path)", ...fail },
    { role: "edge-case", kind: "link-fullwidth-brackets", source: "［Label］(/path)", ...fail },
    { role: "edge-case", kind: "link-fullwidth-parentheses", source: "[Label]（/path）", ...fail },
    { role: "edge-case", kind: "link-missing-close-bracket", source: "[Label(/path)", ...fail },
    { role: "edge-case", kind: "link-unbalanced-destination", source: "[Label](https://example.com/a_(b)", ...fail },
    { role: "edge-case", kind: "link-unterminated-title", source: '[Label](/path "title)', ...fail },
  ]

  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.role}-${fixture.kind ?? fixtureKind(fixture.role)}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixture.kind ?? fixtureKind(fixture.role),
    source: fixture.source,
    expectedStatus: fixture.expectedStatus,
    ...(fixture.expectedFeedbackId ? { expectedFeedbackId: fixture.expectedFeedbackId } : {}),
    ...(fixture.exercisesCheckId ? { exercisesCheckId: fixture.exercisesCheckId } : {}),
    ...(fixture.expectedReviewIds ? { expectedReviewIds: fixture.expectedReviewIds } : {}),
  }))
}

export const linkBatch008Fixtures: readonly ProblemFixture[] =
  linkBatch008Problems.flatMap(createLinkFixtures)
