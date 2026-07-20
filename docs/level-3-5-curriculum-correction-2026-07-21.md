# Level 3-5 Curriculum Correction: Familiarity, Not Difficulty

**Date:** 2026-07-21  
**Status:** Product direction accepted; problem-bank implementation deferred  
**Tracker:** Issue #9

## Why this correction exists

The first advanced-document batch increased difficulty by increasing realism,
document length, domain vocabulary, and the amount of prose a learner had to
read and reproduce. The resulting Level 5 Goals were 59-101 lines long. They
resembled complete company work orders, but completing them felt like doing
office work rather than practising Markdown.

That is the wrong difficulty axis for Nabi.

Nabi's first principle is to teach Markdown syntax through short, repeatable
production. Advanced levels may combine more syntax families, but they must not
test business knowledge, English reading endurance, document authorship, or
typing stamina.

The product motto for the bank remains familiarity through repetition. Common
syntax should recur often. Repetition is not a defect when the repeated action
is the habit Nabi exists to build.

## Correct progression

1. **Level 1 - Learn the syntax.** Produce one visible Markdown pattern at a
   time with direct instruction.
2. **Level 2 - Rebuild real documents.** Reproduce short documents that combine
   familiar patterns.
3. **Level 3 - Write for people.** Use several patterns to make an ordinary
   document easy for another person to scan.
4. **Level 4 - Write for work.** Apply the same approachable workload to short
   workplace notes, plans, handoffs, decisions, and checklists.
5. **Level 5 - Write for developers.** Practise the Markdown forms common in
   developer and AI-assisted work: inline code, fenced code, blockquotes,
   external and reference links, image links with alt text, task lists, nested
   lists, file paths, README fragments, bug reports, PR descriptions, and
   compact agent instructions.

Levels 4 and 5 may have similar reading load and completion time. Level 5 is a
change of context and syntax mix, not a difficulty spike or a final exam.

## Advanced-problem contract

- Keep the prose short enough to understand at a glance.
- Preserve the authored words, blank lines, and line breaks in the learner's
  starter document.
- Ask the learner to add Markdown structure, not to invent or transcribe prose.
- Raise complexity through syntax variety, hierarchy, placement, and at most
  one useful nesting level.
- Keep list items short, normally one sentence and often only a phrase.
- Keep command blocks to one or two lines unless the syntax lesson requires
  otherwise.
- Prefer realistic miniature documents over complete realistic documents.
- Reuse common syntax frequently enough that it becomes automatic.
- Grade Markdown structure only. Domain truth, prose, capitalization, spelling,
  and punctuation remain outside pass/fail.
- Target a casual one-to-three-minute problem, not a work assignment.

Line count alone is not the governing metric. Reading density and the amount of
new learner input matter more. A document may contain several short lines when
the prose and line breaks are already supplied and the learner only adds the
Markdown marks.

## How to use realistic sources

A real company document is a source of document anatomy, not learner copy.
Extract a small structural combination from it, such as:

- title + required reading + constraints;
- goal + ordered steps + stop condition;
- file list + forbidden action + verification command;
- short README section + link + image; or
- bug summary + reproduction list + fenced output.

Do not compress a long work order mechanically. Author a new miniature from
the useful anatomy so the exercise remains coherent after the domain detail is
removed.

The product-owner sketch in
[`examples/level-5-compact-agent-brief-draft.md`](examples/level-5-compact-agent-brief-draft.md)
is the current size-and-density reference. It was drafted quickly to communicate
direction and is not itself a validated Markdown fixture. Its syntax must be
editorially corrected before it becomes a learner problem.

## Consequences for the current bank

- Do not use the existing 59-101-line Level 5 Goals as templates for future
  generation.
- Re-author advanced problems from the corrected contract rather than trimming
  those Goals sentence by sentence.
- Reclassify general workplace scenarios as Level 4.
- Move development-spec material and developer-specific syntax to Level 5.
- Keep the existing advanced problems published until a separately reviewed
  replacement batch is ready; this document does not mutate runtime content.
- Update Issue #9's source-of-truth ladder and authoring skill before the next
  Level 3-5 generation batch.

## Build Week decision record

The correction came from a real product disagreement. Codex optimized the
advanced bank for credible company documents; Jiwon identified that realism had
silently replaced the learning objective. Comparing a full implementation
prompt with a deliberately compressed sketch made the defect visible: the
useful part was the Markdown anatomy, not the prose volume.

The resolved rule is concise:

> Make the document realistic enough to recognize and short enough to practise.

