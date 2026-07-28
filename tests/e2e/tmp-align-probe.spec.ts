import { expect, test } from "@playwright/test"

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"
const OUT =
  "/private/tmp/claude-501/-Users-jiwon-develop-projects-nabimd--claude-worktrees-practice-page-redesign-2c2f4b/b8d2dded-196c-471b-b9db-f4261908b462/scratchpad"

test("probe list and code goal alignment", async ({ page }) => {
  test.setTimeout(300_000)
  const found: Record<string, number> = {}

  for (let seed = 0; seed < 60; seed += 1) {
    await page.addInitScript(
      ([key, value]) => {
        window.sessionStorage.setItem(key as string, value as string)
      },
      [sessionSeedStorageKey, String(seed)],
    )
    await page.goto("/")
    await page.evaluate((storageKey) => {
      window.sessionStorage.removeItem(storageKey)
    }, progressStorageKey)
    await page.reload()
    await page.getByRole("button", { name: "Level 1 — Learn the syntax" }).click()
    await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
    const id =
      (await page
        .locator("[data-problem-id]")
        .first()
        .getAttribute("data-problem-id")) ?? ""

    const kind = id.startsWith("l1-list-")
      ? "list"
      : id.startsWith("l1-code-")
        ? "code"
        : id.startsWith("l1-order-")
          ? "order"
          : null
    if (!kind || found[kind]) continue
    found[kind] = seed

    await page.setViewportSize({ width: 1024, height: 768 })
    const goal = page.locator(
      ".center-card__context-row--current .rendered-document__body > :first-child",
    )
    const info = await goal.evaluate((element) => ({
      tag: element.tagName,
      textAlign: getComputedStyle(element).textAlign,
      fontSize: getComputedStyle(element).fontSize,
    }))
    console.log(
      `ALIGN ${kind} seed=${seed} id=${id} tag=${info.tag} align=${info.textAlign} size=${info.fontSize}`,
    )
    await page.screenshot({ path: `${OUT}/align-${kind}.png` })

    if (Object.keys(found).length >= 3) break
  }
})
