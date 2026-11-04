/**
 * Visitor statistics, only after consent (plan §4.6).
 *
 * The token is the hub's (onsoonlabs `site/consent.js`), so one Cloudflare
 * Web Analytics dashboard splits the site by path. The consent key is
 * nabimd's own: the hub's /privacy/ page declares nabimd out of its scope, so
 * sharing `onsoon-consent` would contradict that notice.
 */
export const CONSENT_STORAGE_KEY = "nabimd.consent.v1"
export const ANALYTICS_TOKEN = "3ad1db46caf044ec95b4bfc8814f0947"
export const BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js"

export type Consent = { v: 1; analytics: boolean }

export function readConsent(): Consent | null {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null",
    )
    if (
      typeof value === "object" &&
      value !== null &&
      (value as Consent).v === 1 &&
      typeof (value as Consent).analytics === "boolean"
    ) {
      return value as Consent
    }
  } catch {
    // An unreadable choice is asked again.
  }
  return null
}

export function storeConsent(analytics: boolean) {
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: 1, analytics } satisfies Consent),
    )
  } catch {
    // Without storage the banner asks again next visit.
  }
}

type BeaconWindow = Window & { __cfBeacon?: unknown }

let loaded = false

/**
 * Adds the beacon once per page. `spa: true` lets it count each address the
 * router pushes (/, /practice, /done); the beacon wraps history.pushState
 * itself, so there is no manual pageview call.
 */
export function loadAnalytics() {
  if (loaded) return
  loaded = true
  // index.html sets this marker before consent so an edge-injected beacon
  // stays silent; the real beacon must not see it.
  delete (window as BeaconWindow).__cfBeacon
  const script = document.createElement("script")
  script.defer = true
  script.src = BEACON_URL
  script.dataset.cfBeacon = JSON.stringify({ token: ANALYTICS_TOKEN, spa: true })
  document.head.appendChild(script)
}

export function startAnalyticsIfConsented() {
  if (readConsent()?.analytics === true) loadAnalytics()
}
