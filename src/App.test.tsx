import { EditorView } from "@codemirror/view"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { koSamples } from "./content/ko/_samples"
import { LANG_STORAGE_KEY } from "./i18n/text"
import { App } from "./App"

function goTo(path: string) {
  window.history.replaceState(null, "", path)
}

function editorView(): EditorView {
  const content = screen
    .getByTestId("rd-editor")
    .querySelector<HTMLElement>(".cm-content")
  const view = content ? EditorView.findFromDOM(content) : null
  if (!view) throw new Error("editor not mounted")
  return view
}

function replaceDraft(text: string) {
  const view = editorView()
  act(() => {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
  })
}

async function renderReady(path = "/") {
  goTo(path)
  render(<App />)
  await waitFor(() => {
    expect(screen.queryByText("문서를 불러오는 중이다.")).not.toBeInTheDocument()
  })
}

beforeEach(() => {
  window.localStorage.setItem(LANG_STORAGE_KEY, "ko")
})

describe("home", () => {
  it("shows the twelve marks and the start button on a first visit", async () => {
    await renderReady("/")
    expect(
      screen.getByRole("heading", { level: 1, name: "실제 문서를 마크다운으로 직접 써 보는 연습이다." }),
    ).toBeInTheDocument()
    const map = screen.getByTestId("mark-map")
    expect(within(map).getAllByRole("button")).toHaveLength(12)
    expect(within(map).getByRole("button", { name: /인용/ })).toHaveAttribute(
      "data-state",
      "new",
    )
    // A mark with no document written for it stays closed rather than
    // borrowing another mark's lesson.
    expect(within(map).getByRole("button", { name: /^제목/ })).toBeDisabled()
    expect(screen.getByTestId("start-run")).toBeEnabled()
    expect(document.documentElement.lang).toBe("ko")
  })

  it("switches every word to English and remembers the choice", async () => {
    const user = userEvent.setup()
    await renderReady("/")
    await user.click(screen.getByTestId("lang-toggle"))

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Practice by writing real documents in Markdown.",
      )
    })
    expect(document.documentElement.lang).toBe("en")
    expect(document.title).toBe("Nabi Markdown — write one document in Markdown")
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en")
    // No Korean left (the toggle names its target language, 한국어, on
    // purpose) and no dictionary key leaking through.
    await waitFor(() => expect(screen.getByTestId("start-run")).toBeEnabled())
    expect(screen.getByTestId("lang-toggle")).toHaveTextContent("한국어")
    const page = document.body.textContent?.replace("한국어", "") ?? ""
    expect(page).not.toMatch(/[가-힣]/)
    expect(page).not.toMatch(/\b(?:home|mark|practice|bar)\.[a-zA-Z-]+/)
  })
})

describe("practice", () => {
  it("starts today's five from home and counts the documents", async () => {
    const user = userEvent.setup()
    await renderReady("/")
    await user.click(screen.getByTestId("start-run"))

    expect(window.location.pathname).toBe("/practice")
    await waitFor(() => {
      expect(screen.getByTestId("run-progress")).toHaveTextContent("오늘의 다섯 장 1/5")
    })
  })

  it("grades in place, offers the answer after two misses, and passes", async () => {
    const user = userEvent.setup()
    const grocery = koSamples[0].problem
    await renderReady(`/practice?doc=${grocery.id}`)

    expect(screen.getByTestId("instruction")).toHaveTextContent(
      "이 문서를 마크다운으로 쓴다. 이번 기호: 목록",
    )
    // The teaching line shows while the mark is untried.
    expect(screen.getByTestId("teaching")).toBeInTheDocument()

    await user.click(screen.getByTestId("check"))
    expect(screen.getByTestId("rd-status")).toHaveTextContent(
      "첫 줄은 # 과 공백으로 시작하는 제목이다.",
    )
    expect(screen.queryByTestId("show-answer")).not.toBeInTheDocument()

    replaceDraft("# 장보기 메모\n\n-우유\n-달걀\n-식빵")
    await user.click(screen.getByTestId("check"))
    expect(screen.getByTestId("rd-status")).toHaveTextContent(
      "목록 기호 뒤에는 공백 하나를 둔다.",
    )

    await user.click(screen.getByTestId("show-answer"))
    expect(screen.getByTestId("rd-answer")).toHaveTextContent("- 우유")

    replaceDraft(grocery.target)
    await user.click(screen.getByTestId("check"))
    expect(screen.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
    expect(screen.getByTestId("rd-status")).toHaveTextContent(
      "통과 — 목록 기호를 바르게 썼다.",
    )
    expect(screen.getByTestId("rd-mine")).toBeInTheDocument()
    expect(screen.getByTestId("next")).toBeInTheDocument()
  })

  it("names the line when the engine can place the miss", async () => {
    const user = userEvent.setup()
    const grocery = koSamples[0].problem
    await renderReady(`/practice?doc=${grocery.id}`)

    replaceDraft("# 장보기 메모\n\n- 우유\n- 달걀\n식빵")
    await user.click(screen.getByTestId("check"))
    expect(screen.getByTestId("rd-status")).toHaveTextContent(
      /^3~5번째 줄: 항목 세 개를/,
    )
  })

  it("shows the hint in two steps, the second one marking the blanks", async () => {
    const user = userEvent.setup()
    await renderReady(`/practice?doc=${koSamples[2]!.problem.id}`)

    await user.click(screen.getByTestId("hint"))
    expect(screen.getByTestId("rd-status")).toHaveTextContent("쓸 기호: >")
    await user.click(screen.getByTestId("hint"))
    expect(screen.getByTestId("rd-status")).toHaveTextContent(
      "예: > 결과는 마크다운으로 준다",
    )
    expect(document.querySelectorAll(".cm-markdown-blank-guide").length).toBeGreaterThan(0)
    await user.click(screen.getByTestId("hint"))
    expect(document.querySelectorAll(".cm-markdown-blank-guide")).toHaveLength(0)
  })

  it("shows code marks in the first hint as code, not wrapped in backticks", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(LANG_STORAGE_KEY, "en")
    await renderReady("/practice?doc=l1-inline-code-blue-value")
    await waitFor(() => screen.getByTestId("rd-editor"))
    await user.click(screen.getByTestId("hint"))
    const status = screen.getByTestId("rd-status")
    expect(status).toHaveTextContent("Marks to use: `")
    expect(status.querySelectorAll("code")).toHaveLength(1)
    expect(status.querySelector("code")).toHaveTextContent(/^`$/)
  })

  it("starts from a blank page on request, keeping typed work", async () => {
    const user = userEvent.setup()
    await renderReady(`/practice?doc=${koSamples[0].problem.id}`)

    await user.click(screen.getByTestId("blank-page-toggle"))
    expect(editorView().state.doc.toString()).toBe("")

    replaceDraft("# 장")
    await user.click(screen.getByTestId("blank-page-toggle"))
    expect(editorView().state.doc.toString()).toBe("# 장")
  })

  it("opens a map cell's mark and moves on within it", async () => {
    const user = userEvent.setup()
    await renderReady("/")
    await user.click(screen.getByRole("button", { name: /번호 목록/ }))

    expect(window.location.search).toBe("?mark=ordered-list")
    await waitFor(() => {
      expect(screen.getByTestId("instruction")).toHaveTextContent("이번 기호: 번호 목록")
    })
  })

  it("goes back home with the browser's back button", async () => {
    const user = userEvent.setup()
    await renderReady("/")
    await user.click(screen.getByTestId("start-run"))
    await waitFor(() => screen.getByTestId("practice"))

    act(() => {
      window.history.back()
    })
    await waitFor(() => {
      expect(screen.getByTestId("mark-map")).toBeInTheDocument()
    })
  })
})

describe("progress and consent", () => {
  it("keeps the map across a reload and clears it from settings", async () => {
    const user = userEvent.setup()
    const grocery = koSamples[0].problem
    const first = await (async () => {
      goTo(`/practice?doc=${grocery.id}`)
      const view = render(<App />)
      await waitFor(() => screen.getByTestId("rd-editor"))
      return view
    })()
    replaceDraft(grocery.target)
    await user.click(screen.getByTestId("check"))
    expect(screen.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
    first.unmount()

    const stored = JSON.parse(window.localStorage.getItem("nabimd.learning.v1") ?? "null")
    expect(stored).toMatchObject({
      v: 1,
      ko: { marks: { "unordered-list": { tries: 1, passes: 1 } }, recentIds: [grocery.id] },
    })

    await renderReady("/")
    const cell = within(screen.getByTestId("mark-map")).getByRole("button", { name: /^목록/ })
    expect(cell).toHaveAttribute("data-state", "tried")

    await user.click(screen.getByTestId("settings"))
    await user.click(screen.getByTestId("clear-progress"))
    await user.click(screen.getByTestId("clear-progress-confirm"))
    expect(cell).toHaveAttribute("data-state", "new")
    expect(window.localStorage.getItem("nabimd.learning.v1")).toBeNull()
  })

  it("removes the retired drill's session progress unread", async () => {
    const { removeRetiredProgress } = await import("./progress/learningStore")
    window.sessionStorage.setItem("nabimd.progress.v5", "{}")
    window.sessionStorage.setItem("nabimd.session-seed.v1", "3")
    removeRetiredProgress()
    expect(window.sessionStorage.getItem("nabimd.progress.v5")).toBeNull()
    expect(window.sessionStorage.getItem("nabimd.session-seed.v1")).toBeNull()
  })

  it("asks about statistics once and loads the beacon only after consent", async () => {
    const user = userEvent.setup()
    await renderReady("/")
    expect(screen.getByTestId("consent")).toBeInTheDocument()
    expect(document.querySelector('script[src*="cloudflareinsights"]')).toBeNull()

    await user.click(screen.getByTestId("consent-reject"))
    expect(screen.queryByTestId("consent")).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem("nabimd.consent.v1")!)).toEqual({
      v: 1,
      analytics: false,
    })
    expect(document.querySelector('script[src*="cloudflareinsights"]')).toBeNull()

    await user.click(screen.getByTestId("open-cookies"))
    await user.click(screen.getByTestId("consent-accept"))
    const beacon = document.querySelector<HTMLScriptElement>('script[src*="cloudflareinsights"]')
    expect(beacon).not.toBeNull()
    expect(JSON.parse(beacon!.dataset.cfBeacon!)).toMatchObject({ spa: true })
  })
})

describe("several tabs and a withdrawn consent", () => {
  it("takes over progress another tab saved instead of overwriting it", async () => {
    await renderReady("/")
    const other = {
      v: 1,
      ko: { marks: { blockquote: { tries: 1, passes: 1, lastAt: 1 } }, recentIds: ["x"] },
      en: { marks: {}, recentIds: [] },
    }
    window.localStorage.setItem("nabimd.learning.v1", JSON.stringify(other))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "nabimd.learning.v1" }))
    })
    const map = screen.getByTestId("mark-map")
    await waitFor(() => {
      expect(within(map).getByRole("button", { name: /인용/ })).toHaveAttribute("data-state", "tried")
    })
    // Taking it over does not write this tab's copy back.
    expect(JSON.parse(window.localStorage.getItem("nabimd.learning.v1")!)).toEqual(other)
  })

  it("reloads without the beacon when consent is withdrawn after it loaded", async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    })
    await renderReady("/")
    await user.click(screen.getByTestId("consent-accept"))
    await user.click(screen.getByTestId("open-cookies"))
    await user.click(screen.getByTestId("consent-reject"))
    expect(JSON.parse(window.localStorage.getItem("nabimd.consent.v1")!)).toMatchObject({
      analytics: false,
    })
    expect(reload).toHaveBeenCalledOnce()
  })
})
