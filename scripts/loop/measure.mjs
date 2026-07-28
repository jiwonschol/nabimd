/**
 * Staging rig and gauges for the design-completeness loop.
 *
 * One command reproduces any state and freezes it into two artefacts: a
 * screenshot the judge looks at, and a JSON row of numbers the loop is scored
 * on. Both are deterministic — the session seed is pinned, so the same commit
 * always renders the same exercise.
 *
 *   node scripts/loop/measure.mjs --base http://127.0.0.1:4174 --out .loop-artifacts
 *
 * It never reports success it did not observe. Every capture asserts the app
 * actually reached the requested state first, and a capture that cannot reach
 * it is recorded as `reached: false` with the reason rather than dropped.
 */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1])
}
const baseUrl = args.get("base") ?? "http://127.0.0.1:4174"
const outDir = resolve(process.cwd(), args.get("out") ?? ".loop-artifacts")

const SEED = "1"
const PROGRESS_KEY = "nabimd.progress.v5"
const SEED_KEY = "nabimd.session-seed.v1"

/** The surfaces the loop is judged on, and the widths each must survive. */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "wide", width: 1800, height: 1000 },
]

const SURFACES = [
  { name: "landing", open: async () => {} },
  { name: "practice", open: openPracticeLevelOne },
  { name: "hint", open: openPracticeWithHint },
]

async function openPracticeLevelOne(page) {
  const button = page.getByRole("button", { name: /^Level 1/ })
  await button.click({ timeout: 15_000 })
  await page.locator(".center-card").waitFor({ state: "visible", timeout: 15_000 })
}

async function openPracticeWithHint(page) {
  await openPracticeLevelOne(page)
  await page.getByRole("button", { name: "Hint" }).click({ timeout: 15_000 })
  await page
    .getByRole("region", { name: "Exact Markdown hint" })
    .waitFor({ state: "visible", timeout: 15_000 })
}

/**
 * Gauges. Each returns plain numbers so a later round can be compared to an
 * earlier one without a model in the loop.
 */
async function gauges(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const round = (n) => Math.round(n * 1000) / 1000

    const visible = (el) => {
      const s = getComputedStyle(el)
      if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0")
        return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.y < vh && r.y + r.height > 0
    }

    // --- inked area: share of the viewport covered by visible content boxes.
    // The complement is the "empty" the design reads as. Boxes are unioned on a
    // coarse grid so overlapping children are not double counted.
    // Measure inside the reading area, not the whole window. The top bar spreads
    // controls across the full width, so a viewport-wide grid always finds ink
    // in every column and every gauge built on it goes blind to the thing the
    // owner reported — a small card adrift in a large empty region.
    const frameEl =
      document.querySelector(".card-practice") ??
      document.querySelector("main") ??
      document.body
    const frame = frameEl.getBoundingClientRect()
    const fx = Math.max(0, frame.x)
    const fy = Math.max(0, frame.y)
    const fw = Math.max(1, Math.min(frame.width, vw - fx))
    const fh = Math.max(1, Math.min(frame.height, vh - fy))

    const CELL = 10
    const cols = Math.ceil(fw / CELL)
    const rows = Math.ceil(fh / CELL)
    const grid = new Uint8Array(cols * rows)
    const contentSelector =
      "p,h1,h2,h3,h4,h5,h6,li,button,input,textarea,a,img,svg,pre,code," +
      ".center-card__box,.center-card__line,.center-card__context"
    for (const el of frameEl.querySelectorAll(contentSelector)) {
      if (!visible(el)) continue
      const r = el.getBoundingClientRect()
      const x0 = Math.max(0, Math.floor((r.x - fx) / CELL))
      const x1 = Math.min(cols - 1, Math.floor((r.x + r.width - fx) / CELL))
      const y0 = Math.max(0, Math.floor((r.y - fy) / CELL))
      const y1 = Math.min(rows - 1, Math.floor((r.y + r.height - fy) / CELL))
      if (x1 < 0 || y1 < 0) continue
      for (let y = y0; y <= y1; y += 1)
        for (let x = x0; x <= x1; x += 1) grid[y * cols + x] = 1
    }
    let inked = 0
    for (const cell of grid) inked += cell
    const inkedRatio = round(inked / grid.length)

    // --- content span: how much of each axis the content actually reaches.
    // Inked area alone is a poor gauge of "empty" — narrowing a card reflows
    // its text taller and leaves the inked total almost unchanged, which is
    // exactly the regression the owner reported. The bounding extent moves.
    let left = Infinity
    let right = -Infinity
    let top = Infinity
    let bottom = -Infinity
    for (const el of frameEl.querySelectorAll(contentSelector)) {
      if (!visible(el)) continue
      const r = el.getBoundingClientRect()
      left = Math.min(left, r.x)
      right = Math.max(right, r.x + r.width)
      top = Math.min(top, r.y)
      bottom = Math.max(bottom, r.y + r.height)
    }
    const hasContent = right > left && bottom > top
    const contentSpanX = hasContent ? round((right - left) / fw) : 0
    const contentSpanY = hasContent ? round((bottom - top) / fh) : 0

    // --- dead bands: the tallest run of empty rows and the widest run of empty
    // columns. This is the gauge that actually tracks the reported problem. A
    // page-wide top bar pins the bounding extent to the full viewport, so span
    // barely moves when the card shrinks; the band between the card and the
    // bottom of the screen grows directly.
    const longestRun = (count, isEmpty) => {
      let best = 0
      let run = 0
      for (let i = 0; i < count; i += 1) {
        run = isEmpty(i) ? run + 1 : 0
        if (run > best) best = run
      }
      return best
    }
    const rowEmpty = (y) => {
      for (let x = 0; x < cols; x += 1) if (grid[y * cols + x]) return false
      return true
    }
    const colEmpty = (x) => {
      for (let y = 0; y < rows; y += 1) if (grid[y * cols + x]) return false
      return true
    }
    const deadBandY = round(longestRun(rows, rowEmpty) / rows)
    const deadBandX = round(longestRun(cols, colEmpty) / cols)

    // --- structural frame: the pattern every shipped practice screen uses.
    // A rail pinned near the top spanning most of the width, and a primary
    // action pinned near the bottom. Without them the empty space has nothing
    // to read against.
    const spansTop = Array.from(document.querySelectorAll("header,nav,div,section"))
      .filter(visible)
      .some((el) => {
        const r = el.getBoundingClientRect()
        return r.y <= 24 && r.width >= vw * 0.9 && r.height <= 120
      })

    const actions = Array.from(document.querySelectorAll("button")).filter(visible)
    const primary = actions
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => b.r.y - a.r.y)[0]
    const bottomAnchored = primary
      ? round((vh - (primary.r.y + primary.r.height)) / vh)
      : null
    const primaryWidthRatio = primary ? round(primary.r.width / vw) : null

    // --- reading measure: characters per line for the longest prose block.
    // Book typography lands between 45 and 75.
    const measures = Array.from(
      document.querySelectorAll("p,li,.center-card__instruction"),
    )
      .filter(visible)
      .map((el) => {
        const r = el.getBoundingClientRect()
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0
        const chars = (el.textContent || "").trim().length
        return { ch: fs ? r.width / (fs * 0.5) : 0, chars }
      })
      .filter((m) => m.chars >= 20)
      .map((m) => m.ch)
    const maxMeasure = measures.length ? round(Math.max(...measures)) : null

    // --- reachability: anything tappable must clear the 44px floor.
    const tappable = actions.concat(
      Array.from(document.querySelectorAll("a,input")).filter(visible),
    )
    const undersized = tappable.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.height < 44 || r.width < 44
    }).length

    // --- overflow: the page must never scroll sideways.
    const horizontalOverflow = round(
      Math.max(0, document.documentElement.scrollWidth - vw),
    )

    return {
      viewport: `${vw}x${vh}`,
      inkedRatio,
      emptyRatio: round(1 - inkedRatio),
      contentSpanX,
      contentSpanY,
      deadBandY,
      deadBandX,
      hasTopRail: spansTop,
      bottomGapRatio: bottomAnchored,
      primaryWidthRatio,
      maxMeasure,
      undersizedTargets: undersized,
      horizontalOverflow,
    }
  })
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  const rows = []

  for (const viewport of VIEWPORTS) {
    for (const surface of SURFACES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      })
      const page = await context.newPage()
      const label = `${surface.name}-${viewport.name}`
      let row
      try {
        await page.addInitScript(
          ([seedKey, seed]) => {
            window.sessionStorage.setItem(seedKey, seed)
          },
          [SEED_KEY, SEED],
        )
        await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 })
        await page.evaluate((key) => window.sessionStorage.removeItem(key), PROGRESS_KEY)
        await page.reload({ waitUntil: "networkidle", timeout: 30_000 })
        await page
          .getByRole("heading", { name: "Choose a chapter to begin." })
          .waitFor({ state: "visible", timeout: 20_000 })

        await surface.open(page)

        // Confirm the app really is on the requested surface before believing
        // any number taken from it.
        const onPractice = (await page.locator(".center-card").count()) > 0
        const expectPractice = surface.name !== "landing"
        if (onPractice !== expectPractice) {
          throw new Error(
            `expected ${expectPractice ? "practice" : "landing"}, found the other`,
          )
        }

        row = { label, reached: true, ...(await gauges(page)) }
        await page.screenshot({ path: `${outDir}/${label}.png` })
      } catch (error) {
        row = {
          label,
          reached: false,
          reason: error instanceof Error ? error.message : String(error),
          viewport: `${viewport.width}x${viewport.height}`,
        }
      }
      rows.push(row)
      await context.close()
    }
  }

  await browser.close()

  const unreached = rows.filter((r) => !r.reached)
  const summary = {
    capturedAt: null, // stamped by the caller; the rig itself stays deterministic
    baseUrl,
    seed: SEED,
    unreached: unreached.length,
    rows,
  }
  await writeFile(`${outDir}/gauges.json`, `${JSON.stringify(summary, null, 2)}\n`)

  for (const row of rows) {
    if (!row.reached) {
      console.log(`  ${row.label}  UNREACHED — ${row.reason}`)
      continue
    }
    console.log(
      `  ${row.label}  deadY=${row.deadBandY} deadX=${row.deadBandX}` +
        `  empty=${row.emptyRatio}  rail=${row.hasTopRail}` +
        `  bottomGap=${row.bottomGapRatio}  measure=${row.maxMeasure}` +
        `  small=${row.undersizedTargets}  overflow=${row.horizontalOverflow}`,
    )
  }

  // A rig that cannot reach a surface must fail loudly rather than let the loop
  // score itself on the surfaces that happened to work.
  if (unreached.length > 0) {
    console.error(`\n${unreached.length} surface(s) unreached — gauges are not trustworthy`)
    process.exit(2)
  }
}

await main()
