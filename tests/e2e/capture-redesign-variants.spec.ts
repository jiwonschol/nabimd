import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

// Level 1 재설계 시안(계획서 §4.8)의 게이트 G1을 돌린다.
// 3 시안 × 2 폭 × 3 상태 = 18장을 docs/design/2026-11-redesign/variants/에
// 쓰는 것은 NABI_WRITE_VARIANT_QA=1일 때만이고, 단언(가로 스크롤 0, 390폭 첫
// 화면에 목표 첫 줄과 에디터 첫 줄 동시 노출, 콘솔 오류 0, axe 대비 위반 0)은
// 보통의 e2e 실행에서도 돈다.
const shouldWrite = process.env.NABI_WRITE_VARIANT_QA === "1"
const outputDirectory = fileURLToPath(
  new URL("../../docs/design/2026-11-redesign/variants/", import.meta.url),
)

const VARIANTS = ["a", "b", "c"] as const
const VIEWPORTS = [
  { name: "1280", width: 1280, height: 800 },
  { name: "390", width: 390, height: 844 },
] as const
const STATES = ["initial", "retry", "pass"] as const

type Variant = (typeof VARIANTS)[number]
type State = (typeof STATES)[number]

// 장보기 메모(src/content/ko/_samples.ts)의 실제 정답과, 목록 항목 하나의
// 기호를 빼서 list-shape 검사에 걸리는 오답. 둘 다 에디터에 입력해 실제 엔진이
// 판정한다.
const GROCERY_PASS = "# 장보기 메모\n\n- 우유\n- 달걀\n- 식빵"
const GROCERY_RETRY = "# 장보기 메모\n\n- 우유\n- 달걀\n식빵"

const consoleErrors = new Map<Page, string[]>()

function trackConsole(page: Page) {
  const errors: string[] = []
  consoleErrors.set(page, errors)
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
}

async function openVariant(page: Page, variant: Variant) {
  await page.goto(`./?variant=${variant}`)
  await expect(page.locator(".rd")).toHaveAttribute("data-variant", variant)
  await expect(page.getByTestId("rd-target").locator("h1")).toHaveText(
    "장보기 메모",
  )
  await page.evaluate(() => document.fonts.ready)
}

async function typeDraft(page: Page, source: string) {
  const editor = page.getByRole("textbox", { name: "내 마크다운" })
  await editor.click()
  // Ctrl+A는 Apple 밖 플랫폼에서 앱의 readline 키맵(줄 처음으로)에 잡혀 전체
  // 선택이 되지 않는다. 편집 호스트에 포커스를 두고 selectAll을 직접 부르면
  // CodeMirror가 DOM 선택 변화를 받아 문서 전체를 선택한다.
  await page.evaluate(() => document.execCommand("selectAll"))
  await page.keyboard.insertText(source)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const mount = document.querySelector(".markdown-source-editor__mount")
        const reader = (mount as { __nabimdReadDocumentForE2E?: () => string } | null)
          ?.__nabimdReadDocumentForE2E
        return reader ? reader() : null
      }),
    )
    .toBe(source)
}

async function reachState(page: Page, state: State) {
  if (state === "initial") return
  await typeDraft(page, state === "retry" ? GROCERY_RETRY : GROCERY_PASS)
  await page.getByRole("button", { name: /^확인/ }).click()
  const bar = page.getByTestId("rd-bar")
  if (state === "retry") {
    await expect(bar).toHaveAttribute("data-tone", "retry")
    await expect(page.getByTestId("rd-status")).toHaveText(
      "3~5번째 줄: 항목 세 개를 - 와 공백으로 시작하는 목록으로 쓴다.",
    )
    await expect(page.locator(".cm-flagged-line")).toHaveCount(3)
  } else {
    await expect(bar).toHaveAttribute("data-tone", "pass")
    await expect(page.getByTestId("rd-status")).toContainText("통과")
    await expect(page.getByRole("button", { name: /다음 장/ })).toBeVisible()
  }
  // 캡처가 단추 위의 포커스 링이 아니라 판정을 보여주도록 포커스를 뺀다.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.clientWidth,
  )
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
}

async function assertFirstLinesInViewport(page: Page, viewportHeight: number) {
  const targetFirstLine = page.getByTestId("rd-target").locator("h1")
  const editorFirstLine = page.getByTestId("rd-editor").locator(".cm-line").first()
  const [target, editor, scrollY] = await Promise.all([
    targetFirstLine.boundingBox(),
    editorFirstLine.boundingBox(),
    page.evaluate(() => window.scrollY),
  ])
  expect(scrollY).toBe(0)
  expect(target).not.toBeNull()
  expect(editor).not.toBeNull()
  for (const [name, box] of [
    ["target", target!],
    ["editor", editor!],
  ] as const) {
    expect(box.y, `${name} top`).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(
      viewportHeight,
    )
  }
  return { target: target!, editor: editor! }
}

async function assertContrast(page: Page) {
  const results = await new AxeBuilder({ page })
    .include(".rd")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  )
  expect(
    serious.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  return results
}

const measurements: Record<string, unknown> = {}

for (const variant of VARIANTS) {
  for (const viewport of VIEWPORTS) {
    for (const state of STATES) {
      test(`시안 ${variant.toUpperCase()} · ${viewport.name} · ${state}`, async ({
        page,
      }) => {
        trackConsole(page)
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        })
        await openVariant(page, variant)
        await reachState(page, state)
        await page.evaluate(() => window.scrollTo(0, 0))

        await assertNoHorizontalScroll(page)
        const boxes =
          viewport.name === "390" && state === "initial"
            ? await assertFirstLinesInViewport(page, viewport.height)
            : null
        const axe = await assertContrast(page)
        expect(consoleErrors.get(page)).toEqual([])

        measurements[`${variant}-${viewport.name}-${state}`] = {
          axeViolations: axe.violations.length,
          ...(boxes
            ? {
                targetFirstLine: {
                  y: Math.round(boxes.target.y),
                  bottom: Math.round(boxes.target.y + boxes.target.height),
                },
                editorFirstLine: {
                  y: Math.round(boxes.editor.y),
                  bottom: Math.round(boxes.editor.y + boxes.editor.height),
                },
              }
            : {}),
        }

        if (shouldWrite) {
          mkdirSync(outputDirectory, { recursive: true })
          await page.screenshot({
            path: `${outputDirectory}${variant}-${viewport.name}-${state}.png`,
            fullPage: false,
            animations: "disabled",
          })
        }
      })
    }
  }
}

test.afterAll(() => {
  if (!shouldWrite) return
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(
    `${outputDirectory}measurements.json`,
    `${JSON.stringify(measurements, null, 2)}\n`,
  )
})

// 두 번 실패하면 판정 바에 "정답 보기"가 더 생긴다(계획서 §4.1). 좁은 폭에서
// 단추 셋과 확인이 한 줄에 몰려 문구를 누르거나 넘치지 않는지 본다 — 시안 B는
// 건너뛰기까지 있어 가장 붐빈다(Codex 리뷰 P2).
for (const width of [768, 390, 320] as const) {
  for (const variant of VARIANTS) {
    test(`시안 ${variant.toUpperCase()} · ${width} · 두 번 실패 뒤 정답 보기`, async ({
      page,
    }) => {
      trackConsole(page)
      await page.setViewportSize({ width, height: 844 })
      await openVariant(page, variant)
      await reachState(page, "retry")
      await page.getByRole("button", { name: /^확인/ }).click()
      const answerButton = page.getByRole("button", { name: "정답 보기" })
      await expect(answerButton).toBeVisible()

      await assertNoHorizontalScroll(page)
      const bar = page.getByTestId("rd-bar")
      const [barBox, statusBox, viewportHeight] = await Promise.all([
        bar.boundingBox(),
        page.getByTestId("rd-status").boundingBox(),
        page.evaluate(() => window.innerHeight),
      ])
      expect(barBox).not.toBeNull()
      expect(statusBox).not.toBeNull()
      // 문구는 한 글자 폭으로 눌리지 않고(폭 160px 이상, 세 줄 이하) 바는
      // 화면의 4분의 1을 넘지 않으며, 단추는 바 안에 머문다(시안 C의 768px
      // 가운데 칸처럼 좁은 열에서 옆 칸으로 흘러넘치지 않는다).
      expect(statusBox!.width).toBeGreaterThanOrEqual(160)
      expect(statusBox!.height).toBeLessThanOrEqual(60)
      expect(barBox!.height).toBeLessThan(viewportHeight / 4)
      const barRight = barBox!.x + barBox!.width + 1
      for (const name of ["힌트", "정답 보기", /^확인/]) {
        const box = await page.getByRole("button", { name }).boundingBox()
        expect(box!.x + box!.width, String(name)).toBeLessThanOrEqual(barRight)
        expect(box!.x, String(name)).toBeGreaterThanOrEqual(barBox!.x - 1)
      }

      await answerButton.click()
      await expect(page.getByTestId("rd-answer")).toContainText("# 장보기 메모")
      await assertNoHorizontalScroll(page)
      expect(consoleErrors.get(page)).toEqual([])
    })
  }
}

// 통과한 뒤에는 에디터 안의 같은 단축키가 "다음 장"으로 이어진다(Codex 리뷰 P2).
test("통과 뒤 에디터 단축키가 다음 장으로 넘어간다", async ({ page }) => {
  trackConsole(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await openVariant(page, "a")
  await typeDraft(page, GROCERY_PASS)
  await page.keyboard.press("Control+Enter")
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
  await expect(page.getByRole("button", { name: /^다음 장/ })).toHaveAttribute(
    "aria-keyshortcuts",
    /Control\+Enter/,
  )
  await page.keyboard.press("Control+Enter")
  await expect(page.getByTestId("rd-target").locator("h1")).toHaveText(
    "11월 기획 회의",
  )
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "idle")
  expect(consoleErrors.get(page)).toEqual([])
})

// 허브 제품 페이지(https://onsoonlabs.com/topki/) 1280 캡처를 시안 A·B·C의
// 1280 '처음' 캡처 옆에 둔 비교 이미지. 바깥 네트워크를 쓰므로 캡처 모드에서만.
test("허브 제품 페이지와 나란히 둔 비교 이미지", async ({ page, browser }) => {
  test.skip(!shouldWrite, "NABI_WRITE_VARIANT_QA=1일 때만 만든다")
  test.setTimeout(120_000)

  const hubPage = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  })
  await hubPage.goto("https://onsoonlabs.com/topki/", {
    waitUntil: "networkidle",
  })
  await hubPage.evaluate(() => document.fonts.ready)
  // 쿠키 창은 첫 방문의 것이지 제품 페이지의 결이 아니다 — 필수만 허용하고 닫는다.
  await hubPage
    .getByRole("button", { name: "필수만 허용" })
    .click({ timeout: 3_000 })
    .catch(() => undefined)
  await hubPage.waitForTimeout(400)
  const hubShot = await hubPage.screenshot({ fullPage: false })
  writeFileSync(`${outputDirectory}hub-topki-1280.png`, hubShot)
  await hubPage.close()

  const shots: Record<string, string> = {
    hub: hubShot.toString("base64"),
  }
  for (const variant of VARIANTS) {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openVariant(page, variant)
    shots[variant] = (
      await page.screenshot({ fullPage: false, animations: "disabled" })
    ).toString("base64")
  }

  // 의존성 없이 합성한다: 네 장을 한 페이지에 깔고 그 페이지를 찍는다.
  const tile = (key: string, caption: string) =>
    `<figure><img src="data:image/png;base64,${shots[key]}" alt=""><figcaption>${caption}</figcaption></figure>`
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
    body{margin:0;background:#ffffff;font-family:-apple-system,"Apple SD Gothic Neo","Pretendard Variable",sans-serif;color:#1f1e1c}
    main{display:grid;grid-template-columns:repeat(2,640px);gap:24px;padding:24px;width:max-content}
    figure{margin:0}
    img{display:block;width:640px;height:400px;border:1px solid #e7e2da;border-radius:8px}
    figcaption{padding:8px 0 0;font-size:15px;font-weight:500}
  </style></head><body><main>
    ${tile("hub", "onsoonlabs.com/topki/ — 허브 제품 페이지 (1280)")}
    ${tile("a", "시안 A 목표 옆에 쓰기 (1280, 처음)")}
    ${tile("b", "시안 B 한 줄 집중 (1280, 처음)")}
    ${tile("c", "시안 C 편집기 (1280, 처음)")}
  </main></body></html>`
  await page.setViewportSize({ width: 1352, height: 920 })
  await page.setContent(html)
  await page.locator("main").screenshot({
    path: `${outputDirectory}compare-with-hub.png`,
  })
})
