import { useText } from "../i18n/useText"

/** The summary after today's five (plan §4.1). */
export function DoneScreen({
  onAgain,
  onHome,
}: {
  onAgain: () => void
  onHome: () => void
}) {
  const { t } = useText()
  return (
    <main className="rd-main rd-done" data-testid="done">
      <h1 className="rd-done__title">{t("done.title")}</h1>
      <div className="rd-done__actions">
        <button
          className="rd-btn rd-btn--primary rd-btn--large"
          data-testid="again"
          onClick={onAgain}
          type="button"
        >
          {t("done.again")}
        </button>
        <button className="rd-btn rd-btn--ghost rd-btn--large" onClick={onHome} type="button">
          {t("done.home")}
        </button>
      </div>
    </main>
  )
}
