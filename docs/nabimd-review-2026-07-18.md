# Nabi Markdown — External QA Review (2026-07-18)

Reviewed: production deploy https://nabimd.vercel.app (= branch `agent/bootstrap-nabi-markdown`, HEAD 6754aa9 — confirmed live behavior matches this build via A11 cross-check).
Method: hands-on user-journey QA in browser + read-only engine analysis with 36 adversarial inputs executed against the actual engine (unit tests: 86/86 green).
This file is out-of-band review input for Jiwon → Codex. Nothing was committed, pushed, or filed against the repo.

## P1 — fix before judging

1. **Happy-path demo ends after ONE problem.** First-try Perfect on `# Apple` → Next → "Heading practice complete." while header still shows "Headings · 1 of 3". Rainy day / Study tools are reachable ONLY via transfer (fail or recall-hint debt). A judge who follows the hint chips will finish the entire demo in ~40 seconds with a progress bar stuck at 1/3. (Live-verified twice; state machine: `next` on non-debt path → completeSession.)
2. **Completion screen is a dead end — zero interactive elements.** No "Start over", no "Practice again", no link to repo/Devpost. A judge (or Jiwon demoing twice on one machine) must clear localStorage to retry.
3. **Spacing feedback misattribution (engine A17/A18).** The `space-after-hash` detector only matches the exact strings `#<title>` / `#<title> #`. So:
   - `#Apple today` → generic "Start the title with…" (real issue: missing space)
   - `#apple` → "Keep the word 'Apple'…" (real issue: missing space + case)
   The "smallest next fix" promise breaks precisely on compound beginner typos. Suggest pattern-based detection (`/^#\S/` on the relevant line) instead of exact-string equality.

## P2 — quality / trust

4. **Setext gets no acknowledgment.** `Rainy day` + `=========` renders in Live Preview IDENTICAL to the goal, yet verdict is "Fail: Start the title with one hash symbol and one space." Valid markdown being failed with a generic message is the #1 trust-crunch moment. Consider a dedicated feedback: "That's a valid heading — this quest practices the `#` style."
5. **Case mismatch feedback misleads.** `# apple` → "Keep the word 'Apple' in your answer." User feels they DID keep the word; nothing says capitalization is the issue.
6. **Invisibles toggle cannot reveal NBSP.** `#`+NBSP+`Apple` fails (correctly), but `invisibleCharacters.ts` marks only space/tab (`/[ \t]/`). The one trap the toggle exists for is invisible to it. Add NBSP (U+00A0, ideally U+3000 too) marking.
7. **"Perfect" is more lenient than "rebuild the target" implies — decide & pin with tests.** All measured Perfect: `# **Apple**`, `` # `Apple` ``, `# [Apple](url)`, `# Apple` + extra paragraph, `# Apple` + extra `## Details`. None of these visually match the goal. Intended (anti-exact-copy philosophy) or defect? Either way it is currently untested behavior — future regressions/policy are unpinned.
8. **Hint collapses after every Check, including Fail.** The moment of failure is peak hint demand. Confirm intended; consider keeping hint state across Check on introduce problems.

## P3 — polish / notes

9. **4-space indent** (`    # Apple`) becomes a code block → generic heading feedback; no mention of the 4-space trap.
10. **Cmd/Ctrl+Enter did not fire under browser automation** (Check button works). Code review says both `Ctrl-Enter` and `Meta-Enter` are bound ahead of defaultKeymap, so this is likely an automation artifact — **needs a 5-second check on a real keyboard** (spec §8 promises it; judges use shortcuts).
11. **Storage schema discards ALL progress if any stored problemId is unknown** (strict `isProgressV1`, no migration). Adding/renaming problems during Build Week resets every visitor's progress — acceptable now, just be aware before renaming IDs.
12. Progress semantics: "N of 3" counts problems, but the normal path never shows 3/3 (see P1-1). If transfer stays struggle-only, consider making the header reflect skills, not problem count.

## Verified green (no action)

- First-visit contract: no landing/signup, wordmark + H1 quest immediate, instruction/goal/hint/editor/preview/status layout per spec; Goal–Hint borders aligned (desktop 1280).
- Fail → repair-in-place → Check again → Perfect loop; feedback clears on edit; judging only on explicit Check (no live grading).
- Recall problems start with hint fully closed, no syntax leak; 3-stage progressive hints (1/3 → Next hint) work; introduce hint auto-open.
- Transfer: fires on fail debt (Apple→Rainy day live-verified), same-family different-content selection, no infinite chains, completes session after transfer problem.
- Persistence: versioned `nabimd.progress.v1`, drafts restored per problem, completion state survives reload; storage-throw fallback to in-memory.
- Equivalences accepted: closing ATX `# Apple #`, 0–3 leading spaces, tab after hash, trailing spaces, internal multi-space/NBSP in title normalized; CRLF handled.
- Blockquoted/nested heading correctly rejected; malformed+correct mixed lines prioritize spacing feedback sensibly.
- Mobile 375px: correct stack order (Instruction→Goal→Hint→editor→preview→status), zero horizontal overflow; desktop console: zero errors/warnings.
- Problem contract: 3 problems × (protected content, 3-stage hints, 3 match checks, editorial check, 6 fixtures) complete; `validateProblemBank` enforces ids/hints/fixtures/retry-family≥2.

## Engine adversarial table (36 cases, measured)

Perfect: `# Apple` / `# Apple #` / 0–3 leading spaces / `#\tApple` / trailing spaces / `#  Apple` (double space) / `# **Apple**`⚠ / `` # `Apple` ``⚠ / `# [Apple](url)`⚠ / `# Apple`+extra paragraph⚠ / +extra `## Details`⚠ / `# Rainy day` internal NBSP or double space.
Matched+review(`one-document-title`): duplicate H1s; `# Apple` + Setext H1 below.
Fail `Add one space after the hash symbol.`: `#Apple` / `#Apple #` / `#Apple\r\n` / `#Apple\n# Apple`.
Fail `Keep the word 'X'…`: empty input / `#` alone / `# apple`⚠ / `# Aple` / wrong text / `#apple`⚠(should be spacing).
Fail `Start the title with one hash symbol and one space.`: Setext⚠(no acknowledgment) / 4-space indent⚠ / NBSP after hash⚠ / fullwidth ＃ / `<h1>` / `## Apple` / `\# Apple` / `> # Apple` / plain text / `#Apple today`⚠(should be spacing).

## Test coverage gaps (hand to Codex as new regression tests)

leading 0–3 vs 4 spaces · NBSP-after-hash + Invisibles NBSP marking · fullwidth ＃ · `<h1>` · inline-markup-in-heading trio (pin current policy either way) · `# apple` case behavior · `#Apple today` / `#apple` spacing-detector bypass · extra-content Perfect (pin policy) · same-text duplicate H1 · `## Apple` · empty input · tab-after-hash · blockquote nesting · malformed+correct mix.
