# CBT Editorial Desk Visual Contract

**Status:** Approved direction consolidated on 2026-07-19
**Reference:** `docs/superpowers/specs/2026-07-19-cbt-editorial-desk-design.md`

This contract supersedes the first Heading MVP's four-surface Editorial Desk.
The familiar computer-based-test frame is now the product grammar: one fixed
top bar, one question sheet, and one answer sheet.

## Fixed viewport frame

- The exercise occupies exactly one browser viewport. The document and body do
  not scroll during practice.
- One top bar contains the Nabi Markdown home wordmark, Exit, Try another,
  level, elapsed clock, scheduled progress, sound, Hint, and Check/Next.
- Exit, Try another, Hint, and Check/Next have equal control dimensions.
- Check/Next is the only filled control. The bottom status bar is removed.
- The wordmark and Exit return directly to the level chooser.

## Question and answer sheets

- The workspace contains exactly two panels: **Goal** on the left and
  **Your answer** on the right.
- Desktop panels are a fixed 50:50 split with identical frame dimensions.
- Long Level 5 work orders scroll inside their panel bodies; panel headers and
  the top bar remain fixed.
- Goal is an immutable rendered reference, not a prose instruction or answer
  state.
- Hint expands vertically inside Goal. Level 1 begins open automatically;
  recall levels begin closed.
- Your answer offers **Write** and **Preview**. After a failed Check, Preview
  becomes **Review** and opens automatically. A separate Live Preview column
  does not exist.

## Beginner-facing language

The answer panel uses learner language instead of implementation vocabulary:

- `Write`, not Source
- `Preview`, not Render
- `Review`, not Diff
- `1 thing to fix`
- `How it should look`
- `What you wrote`
- `How to fix it`
- `Markdown mark`, not AST node, block type, or token mismatch

Review describes only Markdown syntax or document structure. It never presents
capitalization, spelling, punctuation, or exact prose as an error.

## Verdict and focus contract

- There are two verdicts only: **Try again** and **Matched**.
- Each verdict appears briefly in a large, viewport-centered notice. Try again
  uses pale red; Matched uses pale green.
- After Matched, Check becomes Next and receives focus. Bare Space and Enter do
  not advance; they remain ordinary typing keys and are safe for IME users.
- The next problem opens Write and returns focus to the editor.
- One action shortcut invokes Check while editing and Next after Matched:
  `Ctrl+Enter` everywhere, `Cmd+Enter` additionally on macOS, and
  `Shift+Enter` additionally on Windows. The filled control displays the exact
  platform set and exposes the same values through `aria-keyshortcuts`.
- The source editor supports readline caret movement: `Ctrl+A/E` moves to the
  line start/end, `Ctrl+B/F` moves by character, and `Alt+B/F` moves by word.
  CodeMirror's audited default `Mod+Home/End` bindings retain document
  start/end movement. macOS Option-key layouts are handled by physical key
  code so `Option+B/F` cannot degrade into typed special characters.
- `Alt+1` opens Write; `Alt+2` opens Preview or Review. `?` toggles Hint when
  focus is not inside a text-entry surface.

## Color and typography lock

| Role | Value |
|---|---|
| Ink | `#111111` |
| Paper | `#ffffff` |
| Canvas | `#f5f5f2` |
| Muted ink | `#5f5f5a` |
| Rule | `#d7d7d2` |
| Positive border / wash | `#9cb89b` / `rgba(244, 250, 241, 0.97)` |
| Corrective border / wash | `#d7a5a0` / `rgba(255, 246, 245, 0.97)` |
| UI family | system sans until the selected font license is verified |
| Editorial display | system serif |
| Source editor | system monospace |

There are no gradients, glass effects, syntax colors, decorative shadows,
mascots, decorative badges, XP, confetti, or card grids. Compact state labels
remain permissible when they communicate sound or repair state.

## Progress and results

- Levels 1–4 render six scheduled rail markers; Level 5 renders its truthful
  available scheduled count.
- Repair practice does not add a score marker. It keeps the current marker and
  separately exposes the expanded exercise position and total.
- The clock is tabular, survives a same-session reload, and freezes when the
  turn completes.
- One persistent sound preference covers three restrained cues: Matched, Try
  again, and turn completion. The cues share one channel so a newer state can
  replace an obsolete sound rather than overlap it.
- Results preserve the monochrome editorial hierarchy: score and time lead,
  level standing never fabricates data, and syntax review appears only after a
  failed Check.

## Responsive continuation

- Primary desktop verification: `1280 × 800`, `1440 × 900`, and the selected
  visual-reference viewport `1586 × 992`.
- Desktop keeps equal side-by-side panels.
- Narrow screens stack two equal-height panels while retaining the fixed top
  bar and preventing document-level horizontal overflow.
- At 320 px the top bar may scroll horizontally inside itself; it must not
  increase the document width.

## Fidelity checks

Final review compares the approved reference and implementation at the same
viewport for:

1. one fixed top bar and no bottom bar;
2. equal Goal and Your answer frames;
3. centered verdict notice;
4. monochrome hierarchy and thin-rule rhythm;
5. Write/Preview/Review beginner language;
6. internal long-document scrolling;
7. keyboard-only Check, Next, and editor-focus flow, including one shared,
   visible platform-appropriate action shortcut and no Space advance;
8. absence of an always-visible third preview column.
