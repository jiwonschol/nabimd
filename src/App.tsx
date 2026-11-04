import { useCallback, useEffect, useRef, useState } from "react"
import type { MarkId } from "./app/marks"
import type { PracticeItem } from "./app/practiceItem"
import type { SheetResult } from "./app/practiceSheet"
import { navigate, type Route, useRoute } from "./app/routes"
import { pickForMark, pickTodayFive } from "./app/selection"
import { type BankState, useBank } from "./app/useBank"
import { AppHeader } from "./components/AppHeader"
import { ConsentBanner } from "./components/ConsentBanner"
import { DoneScreen } from "./components/DoneScreen"
import { SettingsMenu, SoundToggle } from "./components/HeaderTools"
import { HomeScreen } from "./components/HomeScreen"
import { PracticeScreen, type PracticeView } from "./components/PracticeScreen"
import type { Lang } from "./i18n/text"
import { LanguageProvider, useText } from "./i18n/useText"
import { readConsent } from "./consent/consent"
import { emptyProgress, type LangProgress, recordCheck } from "./progress/learning"
import {
  clearLearning,
  LEARNING_STORAGE_KEY,
  loadLearning,
  resolveLearningStorage,
  saveLearning,
  type StoredLearning,
} from "./progress/learningStore"
import { playFeedbackSound } from "./sound/feedbackSound"
import "./styles/tokens.css"
import "./styles/app.css"

/** Today's five in progress. `index === items.length` means finished. */
type Run = {
  id: number
  lang: Lang
  items: PracticeItem[]
  index: number
  results: (SheetResult | undefined)[]
  /** Progress when the bundle started; the summary shows what changed. */
  before: LangProgress
}

/** One mark (or one linked document) practised open-endedly. */
type Single = {
  /** Which route and language this pick answers. */
  key: string
  seq: number
  item: PracticeItem | null
}

function singleKey(lang: Lang, route: Extract<Route, { name: "practice" }>) {
  return `${lang}|${route.doc ?? ""}|${route.mark ?? ""}`
}

function practiceView(
  route: Route,
  bank: BankState,
  run: Run | null,
  single: Single | null,
  lang: Lang,
  focusEditor: boolean,
): PracticeView {
  if (route.name !== "practice") return { status: "loading" }
  if (bank.status === "loading") return { status: "loading" }
  if (bank.status === "failed") return { status: "failed" }

  if (route.doc || route.mark) {
    if (!single || single.key !== singleKey(lang, route)) {
      return { status: "loading" }
    }
    if (!single.item) return { status: "empty" }
    return {
      status: "ready",
      item: single.item,
      sheetKey: `single-${single.seq}-${single.item.problem.id}`,
      isLast: false,
      focusEditor,
    }
  }

  const item = run && run.lang === lang ? run.items[run.index] : undefined
  if (!run || !item) {
    return run && run.items.length === 0 ? { status: "empty" } : { status: "loading" }
  }
  return {
    status: "ready",
    item,
    sheetKey: `run-${run.id}-${run.index}-${item.problem.id}`,
    position: { current: run.index + 1, total: run.items.length },
    isLast: run.index === run.items.length - 1,
    focusEditor,
  }
}

function Shell() {
  const { lang } = useText()
  const route = useRoute()
  const bank = useBank(lang)
  const [storage] = useState(resolveLearningStorage)
  const [learning, setLearning] = useState<StoredLearning>(() =>
    loadLearning(storage),
  )
  const progress = learning
  const blankPage = learning.blankPage === true
  const [consentOpen, setConsentOpen] = useState(() => readConsent() === null)
  const [run, setRun] = useState<Run | null>(null)
  const [single, setSingle] = useState<Single | null>(null)
  // Set when the learner advanced from the editor by keyboard, so the next
  // document's editor takes focus and typing carries on.
  const [focusEditor, setFocusEditor] = useState(false)
  const sequence = useRef(0)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const skipSave = useRef(true)

  // Progress lives in this browser only (plan §4.5). The first render is the
  // stored value itself, so it is not written back.
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveLearning(storage, learning)
  }, [learning, storage])

  // Another tab of this app saved progress: take it over instead of
  // overwriting it with this tab's older copy on the next save.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LEARNING_STORAGE_KEY && event.key !== null) return
      skipSave.current = true
      setLearning(loadLearning(storage))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [storage])

  const setBlankPage = useCallback((blank: boolean) => {
    setLearning((current) => ({ ...current, blankPage: blank }))
  }, [])

  const clearProgress = useCallback(() => {
    clearLearning(storage)
    skipSave.current = true
    setLearning(emptyProgress())
  }, [storage])

  // Opens what the practice address asks for once the bank is ready: a new
  // today's five, or one document for a mark or a linked id.
  useEffect(() => {
    if (route.name !== "practice" || bank.status !== "ready") return
    const langProgress = progressRef.current[lang]
    if (route.doc || route.mark) {
      const key = singleKey(lang, route)
      if (single?.key === key) return
      const linked = route.doc
        ? bank.items.find((item) => item.problem.id === route.doc)
        : undefined
      // A linked id from the other language falls back to its mark, and the
      // address follows so a reload opens the same mark.
      const mark = route.mark ?? single?.item?.marks[0]
      if (route.doc && !linked && mark) {
        navigate({ name: "practice", mark }, { replace: true })
        return
      }
      const item =
        linked ??
        (mark ? pickForMark(bank.items, mark, langProgress) : null)
      sequence.current += 1
      setSingle({ key, seq: sequence.current, item })
      return
    }
    if (run && run.lang === lang && run.index < run.items.length) return
    sequence.current += 1
    const items = pickTodayFive(bank.items, langProgress)
    setRun({
      id: sequence.current,
      lang,
      items,
      index: 0,
      results: items.map(() => undefined),
      before: langProgress,
    })
  }, [bank, lang, route, run, single])

  const view = practiceView(route, bank, run, single, lang, focusEditor)
  const currentItem = view.status === "ready" ? view.item : null
  const inRun = route.name === "practice" && !route.doc && !route.mark

  const recordResult = useCallback(
    (result: SheetResult) => {
      if (!currentItem) return
      playFeedbackSound(result.passed ? "matched" : "retry")
      setLearning((current) =>
        recordCheck(current, lang, {
          problemId: result.problemId,
          marks: currentItem.marks,
          passed: result.passed,
          at: Date.now(),
        }),
      )
      if (inRun) {
        setRun((current) => {
          if (!current) return current
          const results = [...current.results]
          results[current.index] = result
          return { ...current, results }
        })
      }
    },
    [currentItem, inRun, lang],
  )

  const pickAnotherSingle = useCallback(() => {
    if (bank.status !== "ready" || !currentItem || route.name !== "practice") {
      return
    }
    const mark = currentItem.marks[0]
    const item = pickForMark(bank.items, mark, progressRef.current[lang], [
      currentItem.problem.id,
    ])
    const nextRoute = { name: "practice" as const, mark }
    if (route.doc) navigate(nextRoute, { replace: true })
    sequence.current += 1
    setSingle({ key: singleKey(lang, nextRoute), seq: sequence.current, item })
  }, [bank, currentItem, lang, route])

  const next = useCallback((fromKeyboard: boolean) => {
    setFocusEditor(fromKeyboard)
    if (!inRun) {
      pickAnotherSingle()
      return
    }
    if (!run) return
    const nextIndex = run.index + 1
    setRun({ ...run, index: nextIndex })
    if (nextIndex >= run.items.length) navigate({ name: "done" })
  }, [inRun, pickAnotherSingle, run])

  const another = useCallback(() => {
    setFocusEditor(false)
    if (!inRun) {
      pickAnotherSingle()
      return
    }
    if (!run || bank.status !== "ready" || !currentItem) return
    const inRunIds = run.items.map((item) => item.problem.id)
    const replacement = currentItem.mixed
      ? (bank.items.find(
          (item) => item.mixed && !inRunIds.includes(item.problem.id),
        ) ?? null)
      : pickForMark(
          bank.items,
          currentItem.marks[0],
          progressRef.current[lang],
          inRunIds,
        )
    if (!replacement) return
    const items = [...run.items]
    items[run.index] = replacement
    sequence.current += 1
    setRun({ ...run, id: sequence.current, items })
  }, [bank, currentItem, inRun, lang, run])

  const startRun = useCallback(() => {
    setRun(null)
    navigate({ name: "practice" })
  }, [])

  const closeConsent = useCallback(() => setConsentOpen(false), [])

  const pickMark = useCallback((mark: MarkId) => {
    navigate({ name: "practice", mark })
  }, [])

  return (
    <div className="rd">
      <AppHeader
        tools={
          <>
            <SoundToggle />
            <SettingsMenu onClearProgress={clearProgress} />
          </>
        }
      />
      {route.name === "home" ? (
        <HomeScreen
          bank={bank}
          onOpenCookies={() => setConsentOpen(true)}
          onPickMark={pickMark}
          onStart={startRun}
          progress={progress[lang]}
        />
      ) : route.name === "practice" ? (
        <PracticeScreen
          blankPage={blankPage}
          onAnother={another}
          onBlankPageChange={setBlankPage}
          onChecked={recordResult}
          onNext={next}
          progress={progress[lang]}
          view={view}
        />
      ) : (
        <DoneScreen
          onAgain={startRun}
          onHome={() => navigate({ name: "home" })}
          progress={progress[lang]}
          summary={
            run && run.lang === lang
              ? { items: run.items, results: run.results, before: run.before }
              : null
          }
        />
      )}
      {consentOpen ? <ConsentBanner onClose={closeConsent} /> : null}
    </div>
  )
}

export function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  )
}
