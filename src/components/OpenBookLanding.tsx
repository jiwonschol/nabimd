import { entryChoices, type EntryId } from "../content/entryChoices"
import { Wordmark } from "./Wordmark"

type OpenBookLandingProps = {
  onChoose: (entryId: EntryId) => void
  turningEntryId: EntryId | null
}

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
      <section className="open-book-page open-book-page--intro">
        <Wordmark />
        <div className="open-book-intro">
          <div className="open-book-motto">
            <h2 className="open-book-motto__lead">Markdown is easy.</h2>
            <p className="open-book-motto__body">
              <span>Learning to use it well is just as easy.</span>{" "}
              <span>Nobody ever showed you —</span>{" "}
              <span>that is the only reason you haven't.</span>
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="chapter-index-title"
        className="open-book-page open-book-page--chapters"
      >
        <header className="chapter-index-header">
          <h2 id="chapter-index-title">Choose a chapter to begin.</h2>
        </header>

        <ol className="chapter-index">
          {entryChoices.map((entry) => {
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
                  <span className="chapter-entry__level">{levelLabel}</span>
                  <span className="chapter-entry__copy">
                    <strong>{title}</strong>
                  </span>
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
