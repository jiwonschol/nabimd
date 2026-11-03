import { useEffect, useState } from "react"
import {
  EditorPanel,
  Instruction,
  MyRenderPanel,
  PreviewPanel,
  RedesignHeader,
  TargetPanel,
  VerdictBar,
} from "./parts"
import { usePracticeSheet } from "./usePracticeSheet"
import { readSampleIndex, type RedesignVariant } from "./variantParam"
import "./variants.css"

type VariantAppProps = {
  variant: RedesignVariant
}

const VARIANT_NAMES: Record<RedesignVariant, string> = {
  a: "목표 옆에 쓰기",
  b: "한 줄 집중",
  c: "편집기",
}

/**
 * 시안 A — 왼쪽 목표, 오른쪽 에디터. 판정 바는 에디터 아래 오른쪽 정렬.
 * 통과하면 오른쪽이 "내가 쓴 것" 렌더와 소스(에디터)로 나뉜다.
 */
function VariantA() {
  const sheet = usePracticeSheet(useSampleIndex())
  return (
    <main className="rd-main">
      <Instruction sheet={sheet} />
      <div className="rd-a-grid">
        <TargetPanel sheet={sheet} />
        <div className="rd-a-right">
          {sheet.verdict?.kind === "pass" ? (
            <MyRenderPanel source={sheet.verdict.source} />
          ) : null}
          <EditorPanel sheet={sheet} />
          <VerdictBar className="rd-bar--mobile-fixed" sheet={sheet} />
        </div>
      </div>
    </main>
  )
}

/**
 * 시안 B — 한 열. 지시와 목표 카드, 에디터, 화면 아래 고정 판정 바
 * (건너뛰기 · 힌트 · 확인). 통과하면 목표 카드가 비교 카드로 바뀐다.
 */
function VariantB() {
  const sheet = usePracticeSheet(useSampleIndex())
  return (
    <>
      <main className="rd-main rd-b-col">
        <Instruction sheet={sheet} />
        {sheet.verdict?.kind === "pass" ? (
          <div className="rd-b-compare">
            <TargetPanel sheet={sheet} />
            <MyRenderPanel source={sheet.verdict.source} />
          </div>
        ) : (
          <TargetPanel sheet={sheet} />
        )}
        <EditorPanel sheet={sheet} />
      </main>
      <VerdictBar
        className="rd-bar--fixed"
        extra={
          <button
            className="rd-btn rd-btn--ghost"
            onClick={sheet.next}
            type="button"
          >
            건너뛰기
          </button>
        }
        sheet={sheet}
      />
    </>
  )
}

/**
 * 시안 C — 세 칸: 왼쪽 지시·목표, 가운데 에디터, 오른쪽 실시간 미리보기.
 * 판정 바는 가운데 칸 아래. 휴대폰에서는 미리보기를 탭으로 접고 상하로 쌓는다.
 */
function VariantC() {
  const sheet = usePracticeSheet(useSampleIndex())
  const [pane, setPane] = useState<"editor" | "preview">("editor")
  return (
    <main className="rd-main" data-pane={pane}>
      <div className="rd-c-grid">
        <div className="rd-c-left">
          <Instruction sheet={sheet} />
          <TargetPanel sheet={sheet} />
        </div>
        <div className="rd-c-mid">
          <div aria-label="에디터와 미리보기" className="rd-c-tabs" role="tablist">
            <button
              aria-selected={pane === "editor"}
              className="rd-btn rd-btn--ghost"
              onClick={() => setPane("editor")}
              role="tab"
              type="button"
            >
              에디터
            </button>
            <button
              aria-selected={pane === "preview"}
              className="rd-btn rd-btn--ghost"
              onClick={() => setPane("preview")}
              role="tab"
              type="button"
            >
              미리보기
            </button>
          </div>
          <EditorPanel sheet={sheet} />
          <VerdictBar className="rd-bar--mobile-fixed" sheet={sheet} />
        </div>
        <PreviewPanel source={sheet.draft} />
      </div>
    </main>
  )
}

function useSampleIndex(): number {
  const [index] = useState(() =>
    typeof window === "undefined" ? 0 : readSampleIndex(window.location.search),
  )
  return index
}

export function VariantApp({ variant }: VariantAppProps) {
  useEffect(() => {
    const root = document.documentElement
    const previousLang = root.lang
    const previousTitle = document.title
    root.dataset.redesign = variant
    root.lang = "ko"
    document.title = `Nabi Markdown — 시안 ${variant.toUpperCase()} ${VARIANT_NAMES[variant]}`
    return () => {
      delete root.dataset.redesign
      root.lang = previousLang
      document.title = previousTitle
    }
  }, [variant])

  return (
    <div className={`rd rd--${variant}`} data-variant={variant}>
      <RedesignHeader />
      {variant === "a" ? <VariantA /> : variant === "b" ? <VariantB /> : <VariantC />}
    </div>
  )
}
