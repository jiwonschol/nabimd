import { describe, expect, it } from "vitest"
import { parseRoute, routeHref } from "./routes"

describe("routes", () => {
  it.each([
    ["/nabimd/", "", { name: "home" }],
    ["/nabimd/practice", "", { name: "practice" }],
    ["/nabimd/practice/", "?mark=blockquote", { name: "practice", mark: "blockquote" }],
    ["/nabimd/practice", "?doc=l1-heading-apple", { name: "practice", doc: "l1-heading-apple" }],
    ["/nabimd/practice", "?mark=strikethrough", { name: "practice" }],
    ["/nabimd/done", "", { name: "done" }],
    ["/nabimd/elsewhere", "", { name: "home" }],
  ])("reads %s%s below the production base", (pathname, search, route) => {
    expect(parseRoute(pathname, search, "/nabimd/")).toEqual(route)
  })

  it("reads the same addresses at the development root", () => {
    expect(parseRoute("/practice", "?mark=table", "/")).toEqual({
      name: "practice",
      mark: "table",
    })
    expect(parseRoute("/", "", "/")).toEqual({ name: "home" })
  })

  it("writes addresses that read back to the same route", () => {
    for (const route of [
      { name: "home" },
      { name: "done" },
      { name: "practice" },
      { name: "practice", mark: "image" },
      { name: "practice", doc: "ko-sample-grocery-memo" },
    ] as const) {
      const href = routeHref(route, "/nabimd/")
      const url = new URL(href, "https://onsoonlabs.com")
      expect(parseRoute(url.pathname, url.search, "/nabimd/")).toEqual(route)
    }
  })
})
