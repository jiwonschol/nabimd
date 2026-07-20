# Nabi Markdown Five-Level Problem Bank

**Status:** Approved source of truth for Issue #9

**Date:** 2026-07-19
**Scope:** Standard Markdown curriculum, deterministic grading, and the
build-time publication pipeline

## Product promise

Nabi teaches Markdown as a writing habit. A learner begins by producing one
visible syntax pattern and ends by combining familiar forms in short workplace
and developer documents. The learner is always graded on Markdown structure,
never on copying the Goal's prose.

The learner app has two verdicts:

- **Try again** — the requested Markdown structure is absent or malformed.
- **Matched** — the requested Markdown structure is present. Case, spelling,
  punctuation, and wording do not affect this verdict.

Optional Review may identify additional Markdown-structure refinements after a
Matched result. It is not another grade and cannot revoke Matched. `Perfect`,
exact-string grading, prose correction, and semantic AI grading are not part of
the product.

## Definitive curriculum ladder

### Level 1 — Learn the syntax

Write one syntax pattern while the rule and a different-text example are
visible. Exercises use short, familiar US-English labels and noun phrases.
The purpose is to connect a keystroke pattern to its rendered result.

### Level 2 — Rebuild real documents

Rebuild small rendered documents by combining familiar syntax into useful
shapes. The Goal is still a visible target, but the task is no longer framed as
a memory test. The accepted bank currently provides single-syntax records as a
transitional fallback; runtime prefers composite rebuilds whenever enough are
available. Hint use never changes the grading rule or creates remediation.

### Level 3 — Write for people

Combine syntax families into short ordinary documents that another person can
scan. Exercises teach one document title, logical heading hierarchy, short
paragraph rhythm, appropriate list structure, code blocks, links, and
restrained emphasis.

### Level 4 — Write for work

Apply the same approachable workload to short workplace notes, plans,
handoffs, decisions, and checklists. Complexity comes from combining familiar
Markdown forms, not from business vocabulary, prose volume, or typing stamina.
Nabi verifies the declared Markdown anatomy; it does not decide whether the
learner's prose is professionally or factually correct.

### Level 5 — Write for developers

Practice Markdown forms common in developer and AI-assisted work: inline code,
fenced code, blockquotes, external and reference links, nested lists, file
paths, README fragments, bug reports, PR descriptions, and compact agent
instructions. Task lists and images remain deferred until dedicated validator,
preview, fixture, and accessibility contracts exist. Level 5 changes context
and syntax mix; it does not increase required length or become a final exam.

## Bank target and distribution

The first complete bank contains at least 512 inspected problems:

| Level | Minimum | Curriculum role |
|---|---:|---|
| 1 | 128 | short single-syntax production across the basic syntax surface |
| 2 | 128 | small real-document rebuilds using familiar syntax |
| 3 | 96 | readable ordinary-document compositions |
| 4 | 80 | short workplace-document compositions |
| 5 | 80 | compact developer-document compositions |
| **Total** | **512** | exceeds the 500-vetted-problem gate |

The count is a floor, never a reason to weaken inspection. Per-level,
per-family, and per-flavor counts are generated in the tracker after every
accepted batch.

The standard syntax families are headings and paragraphs, emphasis, lists,
blockquotes, inline code, horizontal rules, links, fenced code blocks, and
images with alt text. Fenced code blocks are a CommonMark-compatible,
Devpost-supported expansion of the initial basic family list.
The published 344-problem checkpoint includes ATX heading lessons from H1
through H6, Level 2 rebuilds whose H1–H3 hierarchy is graded structurally, 12
Level 2 nested-list document rebuilds, two operational-impact briefs, four
integration-contract specs, and six distinct Level 5 work orders. Its level
split is 136/148/30/20/10.
Deep headings remain focused syntax lessons, while ordinary sectioned documents
use the readable H1–H3 range. The nested-list batch requires one root list and
one descendant list while accepting any valid child marker kind and rejecting
list items that render without meaningful visible content.
Paragraph separation remains deferred because Level 1 cannot schedule that
family without the taxonomy and selection paths owned by Issue #50. At 344
accepted problems, 156 more are needed to reach the public 500-problem floor
and 168 more are needed to reach the internal 512-problem closing target.
Image exercises remain blocked until their local assets and alt-text guidance
have been visually and editorially inspected; another ready family may carry
the minimum count while that stop remains local to images.

## Vocabulary progression

Vocabulary metadata is build-time editorial evidence. It never enters a match
predicate.

| Level | Profile | Typical domains |
|---|---|---|
| 1 | `everyday` | fruit, weather, learning tools, home, errands, leisure |
| 2 | `everyday-recall` | routines, preparation, study, sharing, simple plans |
| 3 | `workplace-document` | reading notes, notices, simple plans, how-to notes |
| 4 | `development-spec` | meetings, handoffs, decisions, status, checklists |
| 5 | `agent-workflow` | README fragments, bugs, PRs, code, links, agent notes |

The profile identifiers are retained for accepted-batch compatibility. Their
domains follow the corrected ladder above; the legacy names do not turn Level
4 into a development-spec exam or Level 5 into a full agent-work-order exam.

GPT-5.6 may generate and refine vocabulary ladders at build time. V1 does not
crawl third-party sites. Inspection checks contemporary US-English fit,
typing friction, ambiguity, licensing, and level progression.

## Normalized problem contract

Authoring input may omit `flavor`; normalization adds `"standard"` before any
digest is computed. Runtime records always carry the value explicitly.

```ts
type Problem = {
  schemaVersion: 2
  id: string
  level: 1 | 2 | 3 | 4 | 5
  flavor: "standard"
  familyId: string
  skillIds: readonly string[]
  difficulty: "warmup" | "mixed" | "makeover"
  teachingMode: "introduce" | "recall"
  vocabulary: {
    profile:
      | "everyday"
      | "everyday-recall"
      | "workplace-document"
      | "development-spec"
      | "agent-workflow"
    domains: readonly string[]
    terms: readonly string[]
  }
  teaching: { concept: string; howTo: string; example: string }
  syntaxTokens: readonly string[]
  title: string
  prompt: string
  target: string
  starterText: string
  matchChecks: readonly MatchCheck[]
  editorialChecks: readonly EditorialCheck[]
  hints: readonly [string, string, string]
  retryFamily: string
  contentVariant: string
  reviewTags: readonly string[]
  convention?: { id: string; version: string; reviewedOn: string }
}
```

`teachingMode`, `everyday-recall`, `development-spec`, and `agent-workflow` are
legacy schema values retained to keep accepted, digest-bound batches immutable;
they do not define the corrected learner-facing ladder. The current publisher
still requires convention metadata for every Level 5 record. A later schema
change may limit that metadata to agent-convention lessons, but this docs-only
correction does not weaken the active validator. `contentVariant` is used only
to prevent remediation from repeating displayed material. Goal text, vocabulary
terms, and content variants are never equality operands in learner grading.

The approved target contract gives every level the authored Goal as the fixed
target. The answer sheet starts with that Goal's learner-visible words and line
breaks, with Markdown marks removed. The learner restores the requested
structure instead of inventing or transcribing prose. Higher-level prompts
describe the Markdown anatomy to practice; they do not turn the answer sheet
into a blank authorship exercise. All levels use the same deterministic,
structure-only evaluator. The current `main` runtime still applies this starter
projection to Levels 1–2 only; Levels 3–5 join it through the separately
reviewed Practice change rather than this docs-only correction.

## Deterministic structural grading

The engine parses the answer once and evaluates a closed, typed predicate set.
Predicates may inspect Markdown node types, counts, nesting, order, section
boundaries, and source marker forms explicitly taught by the problem. They may
not inspect required words, title text, case, spelling, punctuation, semantic
truth, prose similarity, source character count, line count, or document
length.

The predicate set supports:

- heading level and explicitly taught ATX source form;
- paragraph, emphasis, blockquote, inline-code, link, image, thematic-break,
  list, and fenced-code presence;
- ordered versus unordered lists and minimum item counts;
- logical heading-depth order;
- block counts and block sequences at document or structural-section scope.

A section is a heading plus following blocks until the next heading of equal or
shallower depth. Section targeting uses heading depth and occurrence, never
heading prose. This lets an advanced problem require, for example, an ordered
list in the third H2 section without requiring the heading to say
`Execution plan`.

Evaluation preserves the existing contract:

1. sort match checks by priority and declaration order;
2. return the first Try again feedback when a predicate fails;
3. only after every match check passes, run optional editorial checks;
4. return Matched with zero to three Markdown-structure review items.

There are no runtime AI calls, network requests, randomness, or target-string
comparisons in this path.

## Fixtures and publication trust gate

Every accepted problem runs through the real grading engine with at least:

1. a canonical Matched answer;
2. different prose with the same structure, also Matched;
3. case or spelling variation with the same structure, also Matched;
4. missing required structure, Try again with the expected feedback ID;
5. malformed requested syntax, Try again with the expected feedback ID;
6. a Matched answer carrying any expected optional Review items; and
7. family-specific parser collisions or wrong sibling constructs where
   applicable.

Equivalent Markdown forms pass unless the lesson explicitly teaches a declared
source convention. Extra valid Markdown passes for single-syntax problems;
composite problems may constrain declared Markdown anatomy, never prose or
document size.

A candidate may enter the runtime bank only when all of these bind to current
digests:

- normalized candidate content;
- a passing real-engine fixture transcript;
- two declared-independent verification records with distinct reviewers and
  run IDs; and
- an editorial acceptance that covers level fit, vocabulary fit, ambiguity,
  Goal quality, and the grammar-only boundary.

Any content or fixture change invalidates the associated approvals. Reviewer
disagreement, malformed evidence, or any unresolved candidate blocks the whole
immutable batch. The accepted set must exactly equal the compiled runtime set;
the publisher never salvages a clean-looking subset from a failed batch.

## Reproducible batch loop

Problem-bank work is append-only by batch:

```text
generate -> normalize -> verify with the real engine ->
independent inspection -> editorial decision -> compile -> bank-wide gate -> PR
```

Each batch stores its prompt/provenance, normalized candidates, fixtures,
verification records, and editorial decisions. The compiler then regenerates
the canonical runtime bank and count tracker. A batch PR carries `Refs #9`;
the PR that proves at least 512 accepted problems carries `Closes #9`.

The gate rejects duplicate IDs, unsupported flavors, invalid level/profile
pairings, empty or malformed checks, missing transfer variants, stale digests,
fixture failures, reviewer disagreement, editorial rejection, publish-set
drift, and bank-wide count regressions.

## Runtime selection contract

The corrected learner-facing task types are Learn the syntax, Rebuild real
documents, Write for people, Write for work, and Write for developers. The
current app retains the former Level 4–5 labels until a separately reviewed UI
change lands; this docs-only correction does not silently mutate that runtime.
Scheduling first filters by exact level and `standard` flavor, then rotates
deterministically.

For Levels 1–4, a scheduled turn contains six problems: four at the chosen
level followed by two next-level challenges. The first four begin with Hint
open; the challenges begin with it closed. Hint is always manually available
and never creates remediation. Level 5 schedules up to six unique at-level
problems; the current four-problem bank degrades to four rather than duplicating
content.

Only a failed Check creates a same-skill, different-content remediation. That
repair may extend a six-problem turn to seven and is exempt from the scheduled
family-adjacency contract. Try another remains within the same level, flavor,
and retry family and requires a different `contentVariant`.

Level 1 and transitional single-syntax Level 2 scheduling use one centralized
weighted family policy. Ordered and unordered lists receive a mild boost;
inline code, links, and images receive a mild reduction; all other supported
families use baseline weight. Adjacent scheduled problems never repeat the
same family, including across turn boundaries. A family appears no more than
twice per turn, and distinct families are preferred while supply permits.
Composite Level 2 rebuilds are exempt from this single-family rule. The two
challenge slots prefer distinct structural families or retry families.

All counts, spillover, Hint boundary, challenge offset, and family weights live
in the runtime policy module. Adding a batch must not silently mutate an active
run; persisted runs record the compiled bank revision and reset safely when
that revision or schedule contract changes.

## Level 3–5 structural archetypes

Level 3 rotates short human documents such as reading notes, event notices,
how-to notes, simple plans, and handoffs. Their anatomy combines a single H1,
ordered H2 hierarchy, short paragraphs, and the list or code structure suited
to the document.

Level 4 rotates short workplace notes, status updates, meeting records,
decisions, checklists, and handoffs. Their anatomy combines one title, a small
number of sections, concise prose, and two or three short list items where the
lesson requires them.

Level 5 rotates README fragments, bug reports, PR descriptions, compact
implementation notes, and short agent instructions. Their anatomy combines
developer-facing forms such as inline or fenced code, links, blockquotes,
nested lists, and file paths without demanding a complete real-world work
order.

These names describe editorial archetypes, not strings the learner must copy.

## Explicit boundaries

Issue #9 does not add GFM lessons or flavor UI, runtime AI, semantic grading,
spelling or grammar correction, exact-copy grading, web crawling, or a claim
that the app can validate the factual safety of an AI work order. Nabi teaches
and verifies the Markdown structure that makes those documents inspectable.

The anonymized Level 5 reference remains a north star, not an answer to copy.
Its earlier `Perfect` and protected-prose language is superseded by this spec
and D9/D10: there is one passing verdict, Matched, and runtime grading is
structure-only.
