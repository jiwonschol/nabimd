import { useEffect, useState } from "react"
import { isMark, type MarkId } from "./marks"

/**
 * Three addresses, so the analytics beacon can count the steps (plan §4.6):
 * `/` home, `/practice` writing, `/done` summary — all below the deployment
 * base (`NABI_BASE_PATH`, `/nabimd/` in production).
 *
 * `/practice` alone is today's five; `?mark=` practises one mark; `?doc=`
 * opens one document by id (a link or an end-to-end test).
 */
export type Route =
  | { name: "home" }
  | { name: "practice"; mark?: MarkId; doc?: string }
  | { name: "done" }

const NAVIGATE_EVENT = "nabimd:navigate"

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`
}

export function parseRoute(
  pathname: string,
  search: string,
  base: string,
): Route {
  const root = normalizeBase(base)
  const rest = pathname.startsWith(root)
    ? pathname.slice(root.length)
    : pathname.replace(/^\//, "")
  const segment = rest.replace(/\/+$/, "")
  if (segment === "practice") {
    const params = new URLSearchParams(search)
    const mark = params.get("mark")
    const doc = params.get("doc")?.trim()
    return {
      name: "practice",
      ...(mark && isMark(mark) ? { mark } : {}),
      ...(doc ? { doc } : {}),
    }
  }
  if (segment === "done") return { name: "done" }
  return { name: "home" }
}

export function routeHref(route: Route, base: string): string {
  const root = normalizeBase(base)
  switch (route.name) {
    case "home":
      return root
    case "done":
      return `${root}done`
    case "practice": {
      const params = new URLSearchParams()
      if (route.mark) params.set("mark", route.mark)
      if (route.doc) params.set("doc", route.doc)
      const query = params.toString()
      return `${root}practice${query ? `?${query}` : ""}`
    }
  }
}

const base = () => import.meta.env.BASE_URL

export function currentRoute(): Route {
  return parseRoute(window.location.pathname, window.location.search, base())
}

export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const href = routeHref(route, base())
  if (options.replace) window.history.replaceState(null, "", href)
  else window.history.pushState(null, "", href)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo?.(0, 0)
}

/** The current route, following pushes from `navigate` and Back/Forward. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute)
  useEffect(() => {
    const update = () => setRoute(currentRoute())
    window.addEventListener("popstate", update)
    window.addEventListener(NAVIGATE_EVENT, update)
    return () => {
      window.removeEventListener("popstate", update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])
  return route
}
