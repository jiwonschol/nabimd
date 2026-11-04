import { useId } from "react"
import { MARK_EXAMPLES, MARKS, markNameKey, type MarkId } from "../app/marks"
import type { PracticeItem } from "../app/practiceItem"
import { hasDocumentForMark } from "../app/selection"
import type { BankState } from "../app/useBank"
import type { TextKey } from "../i18n/ko"
import { useText } from "../i18n/useText"
import { type LangProgress, markState } from "../progress/learning"

const SOURCE_URL = "https://github.com/jiwonschol/nabimd"

function markExample(mark: MarkId, t: (key: TextKey) => string): string {
  const example = MARK_EXAMPLES[mark]
  return example.startsWith("markExample.") ? t(example as TextKey) : example
}

function MarkMap({
  items,
  progress,
  onPickMark,
}: {
  /** Null while the bank is loading: cells show progress but wait. */
  items: readonly PracticeItem[] | null
  progress: LangProgress
  onPickMark: (mark: MarkId) => void
}) {
  const { t } = useText()
  return (
    <ul className="rd-map" data-testid="mark-map">
      {MARKS.map((mark) => {
        const available = items === null || hasDocumentForMark(items, mark)
        const state = available ? markState(progress, mark) : "unavailable"
        const stateText = t(`markState.${state}`)
        return (
          <li key={mark}>
            <button
              className="rd-map__cell"
              data-mark={mark}
              data-state={state}
              disabled={!available || items === null}
              onClick={() => onPickMark(mark)}
              type="button"
            >
              <span className="rd-map__name">{t(markNameKey(mark))}</span>
              <code className="rd-map__example">{markExample(mark, t)}</code>
              <span className="rd-map__state">
                <span aria-hidden="true" className="rd-map__dot" />
                {stateText}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Footer() {
  const { t } = useText()
  const base = import.meta.env.BASE_URL
  return (
    <footer className="rd-footer">
      <a href={SOURCE_URL} rel="noreferrer" target="_blank">
        {t("footer.source")}
        <span className="visually-hidden"> ({t("footer.newTab")})</span>
      </a>
      <a href={`${base}third-party-licenses.html`} rel="noreferrer" target="_blank">
        {t("footer.licenses")}
        <span className="visually-hidden"> ({t("footer.newTab")})</span>
      </a>
      <span>{t("footer.version", { version: __APP_VERSION__ })}</span>
    </footer>
  )
}

export function HomeScreen({
  bank,
  progress,
  onStart,
  onPickMark,
}: {
  bank: BankState
  progress: LangProgress
  onStart: () => void
  onPickMark: (mark: MarkId) => void
}) {
  const { t } = useText()
  const mapHeadingId = useId()
  const ready = bank.status === "ready"

  return (
    <>
      <main className="rd-main rd-home">
        <section className="rd-home__intro">
          <h1 className="rd-home__headline">{t("home.headline")}</h1>
          <p className="rd-home__lead">{t("home.lead")}</p>
          <button
            className="rd-btn rd-btn--primary rd-btn--large"
            data-testid="start-run"
            disabled={!ready}
            onClick={onStart}
            type="button"
          >
            {t("home.start")}
          </button>
        </section>
        <section aria-labelledby={mapHeadingId} className="rd-home__map">
          <h2 className="visually-hidden" id={mapHeadingId}>
            {t("home.mapHeading")}
          </h2>
          {bank.status === "failed" ? (
            <p className="rd-note" role="alert">
              {t("home.loadFailed")}
            </p>
          ) : (
            <MarkMap
              items={ready ? bank.items : null}
              onPickMark={onPickMark}
              progress={progress}
            />
          )}
          {bank.status === "loading" ? (
            <p aria-live="polite" className="rd-note">
              {t("home.loading")}
            </p>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  )
}
