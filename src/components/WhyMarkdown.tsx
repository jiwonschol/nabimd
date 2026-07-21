import { Fragment, useEffect, useState } from "react"

type Reason = { lead: string; support: string }
type Phase = { index: number; state: "active" | "exiting" } | null

export const WHY_OPENING_QUESTION = "Why bother with a format this simple?"

export const WHY_REASONS: Reason[] = [
  {
    lead: "You are already typing into Markdown fields.",
    support:
      "GitHub, Slack, Discord, Notion, and most AI chat boxes already accept it — learn it once, use it everywhere.",
  },
  {
    lead: "Knowing the syntax is not the same as using it.",
    support:
      "Ten minutes teaches you the marks. Repetition is what makes your hands reach for them.",
  },
  {
    lead: "You format without leaving the keyboard.",
    support:
      "A heading is a hash and a space, not a trip to a toolbar — the document takes shape while you keep typing.",
  },
  {
    lead: "People read a well-organized document faster.",
    support: "Headings and lists let a reader find the one line they came for.",
  },
  {
    lead: "Write documents well, and your AI requests get specific.",
    support:
      "The same structure separates your goal, your limits, and the output you want — so there is less to guess.",
  },
]

export const GLYPH_DELAY_MS = 32
export const GLYPH_ENTER_MS = 96
export const LEAD_PAUSE_MS = 240
export const HOLD_MS = 4500
export const WHY_EXIT_MS = 220
export const WHY_GAP_MS = 160
export const ONSET_MS = 1400

const splitGraphemes = (copy: string) => {
  if (typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(copy), ({ segment }) => segment)
  }
  return Array.from(copy)
}

const visibleGlyphCount = (copy: string) => splitGraphemes(copy).filter((glyph) => !/\s/.test(glyph)).length

export function revealDuration(reason: Reason) {
  const leadGlyphs = visibleGlyphCount(reason.lead)
  const supportGlyphs = visibleGlyphCount(reason.support)
  if (!leadGlyphs) return supportGlyphs ? (supportGlyphs - 1) * GLYPH_DELAY_MS + GLYPH_ENTER_MS : 0
  if (!supportGlyphs) return (leadGlyphs - 1) * GLYPH_DELAY_MS + GLYPH_ENTER_MS
  return (
    (leadGlyphs - 1) * GLYPH_DELAY_MS +
    GLYPH_ENTER_MS +
    LEAD_PAUSE_MS +
    (supportGlyphs - 1) * GLYPH_DELAY_MS +
    GLYPH_ENTER_MS
  )
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function canAnimateReasons() {
  return (
    typeof Element !== "undefined" &&
    typeof Element.prototype.animate === "function" &&
    !prefersReducedMotion()
  )
}

function shuffle<T>(values: T[]) {
  const result = values.slice()
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = result[i]!
    result[i] = result[j]!
    result[j] = swap
  }
  return result
}

function AnimatedCopy({ copy, startDelayMs = 0 }: { copy: string; startDelayMs?: number }) {
  let glyphIndex = 0
  return (
    <>
      {copy.split(" ").map((word, wordIndex, words) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="open-book-why__word">
            {splitGraphemes(word).map((glyph, index) => {
              const delay = startDelayMs + glyphIndex * GLYPH_DELAY_MS
              glyphIndex += 1
              return (
                <span
                  aria-hidden="true"
                  className="open-book-why__glyph"
                  key={`${glyph}-${index}`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {glyph}
                </span>
              )
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}

export function WhyMarkdown() {
  const [animated] = useState(canAnimateReasons)
  const [phase, setPhase] = useState<Phase>(null)

  useEffect(() => {
    if (!animated) return

    const order = shuffle(WHY_REASONS.map((_, index) => index))
    const sequence = [...order, ...order, ...order]
    const timers: number[] = []
    let cancelled = false

    const play = (step: number) => {
      if (cancelled) return
      const index = sequence[step]
      if (index === undefined) return
      setPhase({ index, state: "active" })
      if (step === sequence.length - 1) return
      const reason = WHY_REASONS[index]!
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return
          setPhase({ index, state: "exiting" })
          timers.push(window.setTimeout(() => play(step + 1), WHY_EXIT_MS + WHY_GAP_MS))
        }, revealDuration(reason) + HOLD_MS),
      )
    }

    timers.push(window.setTimeout(() => play(0), ONSET_MS))
    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [animated])

  return (
    <section
      aria-label="Why learn Markdown"
      className={`open-book-why${animated ? "" : " open-book-why--static"}`}
    >
      <p className="open-book-why__question">{WHY_OPENING_QUESTION}</p>
      <ul
        aria-label={animated ? undefined : "Reasons to learn Markdown"}
        className="open-book-why__stage"
        tabIndex={animated ? undefined : 0}
      >
        {WHY_REASONS.map((reason, index) => {
          const isActive = phase?.index === index
          const leadGlyphs = visibleGlyphCount(reason.lead)
          const supportStartMs = leadGlyphs
            ? (leadGlyphs - 1) * GLYPH_DELAY_MS + GLYPH_ENTER_MS + LEAD_PAUSE_MS
            : 0
          return (
            <li
              aria-label={`${reason.lead} ${reason.support}`}
              className={`open-book-why__reason${isActive ? ` open-book-why__reason--${phase.state}` : ""}`}
              key={reason.lead}
            >
              {animated ? (
                <>
                  <span aria-hidden="true" className="open-book-why__lead">
                    <AnimatedCopy copy={reason.lead} />
                  </span>
                  <span aria-hidden="true" className="open-book-why__support">
                    <AnimatedCopy copy={reason.support} startDelayMs={supportStartMs} />
                  </span>
                </>
              ) : (
                <>
                  <span className="open-book-why__lead">{reason.lead}</span>
                  <span className="open-book-why__support">{reason.support}</span>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
