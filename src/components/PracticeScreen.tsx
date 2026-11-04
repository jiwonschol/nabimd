import type { MouseEvent } from "react"
import type { PracticeItem } from "../app/practiceItem"
import type { SheetResult } from "../app/practiceSheet"
import { navigate, routeHref } from "../app/routes"
import { useText } from "../i18n/useText"
import type { LangProgress } from "../progress/learning"
import { PracticeSheetView } from "./PracticeSheetView"

export type PracticeView =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "empty" }
  | {
      status: "ready"
      item: PracticeItem
      /** Changes whenever a new document opens, remounting the sheet. */
      sheetKey: string
      /** Today's five only: which document of how many. */
      position?: { current: number; total: number }
      isLast: boolean
      /** Focus the editor on open (the learner advanced by keyboard). */
      focusEditor: boolean
    }

export function PracticeScreen({
  view,
  progress,
  blankPage,
  onBlankPageChange,
  onChecked,
  onNext,
  onAnother,
}: {
  view: PracticeView
  progress: LangProgress
  blankPage: boolean
  onBlankPageChange: (blank: boolean) => void
  onChecked: (result: SheetResult) => void
  onNext: (fromKeyboard: boolean) => void
  onAnother: () => void
}) {
  const { t } = useText()
  const base = import.meta.env.BASE_URL

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    navigate({ name: "home" })
  }

  return (
    <main
      className="rd-main rd-practice"
      data-problem-id={view.status === "ready" ? view.item.problem.id : undefined}
      data-testid="practice"
    >
      <nav className="rd-topline">
        <a className="rd-link" href={routeHref({ name: "home" }, base)} onClick={goHome}>
          {t("practice.home")}
        </a>
        {view.status === "ready" && view.position ? (
          <span className="rd-topline__progress" data-testid="run-progress">
            {t("practice.runProgress", view.position)}
          </span>
        ) : null}
        {view.status === "ready" ? (
          <button
            className="rd-link rd-topline__another"
            data-testid="another"
            onClick={onAnother}
            type="button"
          >
            {t("practice.another")}
          </button>
        ) : null}
      </nav>
      {view.status === "ready" ? (
        <PracticeSheetView
          blankPage={blankPage}
          focusOnOpen={view.focusEditor}
          item={view.item}
          key={view.sheetKey}
          nextLabel={view.isLast ? t("bar.finish") : t("bar.next")}
          onBlankPageChange={onBlankPageChange}
          onChecked={onChecked}
          onNext={onNext}
          progress={progress}
        />
      ) : (
        <p aria-live="polite" className="rd-note">
          {view.status === "loading"
            ? t("practice.loading")
            : view.status === "failed"
              ? t("home.loadFailed")
              : t("practice.empty")}
        </p>
      )}
    </main>
  )
}
