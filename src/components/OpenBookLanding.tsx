import { entryChoices, type EntryId } from "../content/entryChoices"
import { Wordmark } from "./Wordmark"
import { BookSpine } from "./BookSpine"

type OpenBookLandingProps = {
  onChoose: (entryId: EntryId) => void
  turningEntryId: EntryId | null
}

const levelDescriptions = [
  "Learn the building blocks of Markdown.",
  "Mix familiar marks to express meaning.",
  "Make documents clear and consistent.",
  "Write specifications people can use.",
  "Give agents precise instructions.",
] as const

function splitEntryLabel(label: string) {
  const [levelLabel, title = label] = label.split(" — ", 2)
  return { levelLabel, title }
}

export function OpenBookLanding({
  onChoose,
  turningEntryId,
}: OpenBookLandingProps) {
  const turning = turningEntryId !== null

  return (
    <main
      aria-hidden={turning || undefined}
      className={`app-shell open-book-shell${turning ? " open-book-shell--turning" : ""}`}
      data-testid={turning ? "page-turn-transition" : undefined}
    >
      <BookSpine testId="landing-book-spine" />
      <section className="open-book-page open-book-page--intro">
        <Wordmark />
        <div className="open-book-intro">
          <p className="open-book-kicker">A short daily writing practice</p>
          <h2>Structure becomes instinct.</h2>
          <p className="open-book-deck">
            Learn Markdown in short, repeatable briefs.
          </p>
        </div>
        <ol aria-label="How practice works" className="open-book-method">
          <li>
            <span>01</span>
            <strong>Brief</strong>
          </li>
          <li>
            <span>02</span>
            <strong>Write source</strong>
          </li>
          <li>
            <span>03</span>
            <strong>Inspect render</strong>
          </li>
          <li>
            <span>04</span>
            <strong>Prove again</strong>
          </li>
        </ol>
        <p className="open-book-method-line">
          Brief → Write source → Inspect render → Prove again
        </p>
      </section>

      <section
        aria-labelledby="chapter-index-title"
        className="open-book-page open-book-page--chapters"
      >
        <header className="chapter-index-header">
          <p>Five levels · ten quiet minutes at a time</p>
          <h2 id="chapter-index-title">Choose a chapter to begin.</h2>
          <span>There is no wrong place to start.</span>
        </header>

        <ol className="chapter-index">
          {entryChoices.map((entry, index) => {
            const { levelLabel, title } = splitEntryLabel(entry.label)
            const selected = turningEntryId === entry.id
            return (
              <li key={entry.id}>
                <button
                  aria-current={selected ? "true" : undefined}
                  aria-label={turning ? undefined : entry.label}
                  className="chapter-entry"
                  disabled={turning}
                  onClick={() => onChoose(entry.id)}
                  type="button"
                >
                  <span className="chapter-entry__number">
                    {String(entry.level).padStart(2, "0")}
                  </span>
                  <span className="chapter-entry__copy">
                    <strong>{title}</strong>
                    <small>{levelDescriptions[index]}</small>
                  </span>
                  <span className="chapter-entry__level">{levelLabel}</span>
                  <span aria-hidden="true" className="chapter-entry__arrow">
                    →
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
