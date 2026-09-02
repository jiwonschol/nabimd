const basePath = "/nabimd"

type AssetFetcher = {
  fetch(request: Request): Promise<Response>
}

type Env = {
  ASSETS: AssetFetcher
  // These bindings are intentionally not exposed through a public endpoint
  // until score identity, abuse prevention, and retention rules are designed.
  NABIMD_ASSETS: unknown
  NABIMD_DB: unknown
}

function applicationAssetRequest(request: Request): Request | Response {
  const url = new URL(request.url)

  if (url.pathname === basePath) {
    url.pathname = `${basePath}/`
    return Response.redirect(url.toString(), 308)
  }

  if (!url.pathname.startsWith(`${basePath}/`)) {
    return new Response("Not Found", { status: 404 })
  }

  // Static Assets are stored with paths rooted at /, while the public app is
  // mounted below /nabimd. Preserve the request method and headers, but ask
  // the asset service for the prefix-free asset path.
  url.pathname = url.pathname.slice(basePath.length) || "/"
  return new Request(url, request)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const assetRequest = applicationAssetRequest(request)
    if (assetRequest instanceof Response) return assetRequest

    const response = await env.ASSETS.fetch(assetRequest)
    const location = response.headers.get("Location")

    // Static Assets can canonicalize an .html request to its extensionless
    // form. Its Location is root-relative, so reapply our mount path before
    // the browser follows it.
    if (
      location?.startsWith("/") &&
      !location.startsWith(`${basePath}/`) &&
      response.status >= 300 &&
      response.status < 400
    ) {
      const headers = new Headers(response.headers)
      headers.set("Location", `${basePath}${location}`)
      return new Response(response.body, { headers, status: response.status })
    }

    return response
  },
}
