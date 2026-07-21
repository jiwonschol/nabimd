import { useEffect, useRef, useState } from "react"

type Reason = { lead: string; support: string }

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

// The reasons cycle one at a time across three decelerating passes, then rest.
// "Slowness" lives in the holds, not the fade: the rise reuses the app's own
// reveal curve (summary-ink-reveal) rather than a dreamy loader-length fade.
const PASSES = [
  { enterMs: 640, travel: 12, holdMs: 2200, gapMs: 900 },
  { enterMs: 780, travel: 9, holdMs: 3000, gapMs: 1200 },
  { enterMs: 920, travel: 6, holdMs: 3800, gapMs: 1600 },
]
const EXIT_MS = 480
const ONSET_MS = 1400
const ENTER_EASING = "cubic-bezier(0.22, 0.72, 0.2, 1)"
const EXIT_EASING = "cubic-bezier(0.32, 0, 0.67, 0)"

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

// Fall back to the static list whenever we cannot animate cleanly — reduced
// motion, or an environment without the Web Animations API (older browsers,
// jsdom). The static state shows all five reasons, which is also the most
// legible outcome, so degradation only ever reveals more, never less.
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

export function WhyMarkdown() {
  const reasonRefs = useRef<Array<HTMLLIElement | null>>([])
  const [animated] = useState(canAnimateReasons)

  useEffect(() => {
    if (!animated) return

    // One shuffled order, reused across all three passes; the terminal frame is
    // whatever the shuffle dealt last, so each visit rests on a different reason.
    const order = shuffle(WHY_REASONS.map((_, index) => index))
    const sequence = PASSES.flatMap((pass) =>
      order.map((idx) => ({ idx, ...pass })),
    )

    const timers: number[] = []
    const animations: Animation[] = []
    let cancelled = false

    const play = (step: number) => {
      if (cancelled) return
      const frame = sequence[step]
      if (!frame) return
      const node = reasonRefs.current[frame.idx]
      if (node) {
        animations.push(
          node.animate(
            [
              { opacity: 0, transform: `translateY(${frame.travel}px)` },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: frame.enterMs, easing: ENTER_EASING, fill: "forwards" },
          ),
        )
      }
      if (step >= sequence.length - 1) return // rest on the final reason
      timers.push(
        window.setTimeout(() => {
          if (node) {
            animations.push(
              node.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: EXIT_MS,
                easing: EXIT_EASING,
                fill: "forwards",
              }),
            )
          }
          timers.push(
            window.setTimeout(() => play(step + 1), EXIT_MS + frame.gapMs),
          )
        }, frame.holdMs),
      )
    }

    timers.push(window.setTimeout(() => play(0), ONSET_MS))

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
      animations.forEach((animation) => animation.cancel())
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
        {WHY_REASONS.map((reason, index) => (
          <li
            className="open-book-why__reason"
            key={reason.lead}
            ref={(node) => {
              reasonRefs.current[index] = node
            }}
          >
            <span className="open-book-why__lead">{reason.lead}</span>
            <span className="open-book-why__support">{reason.support}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
