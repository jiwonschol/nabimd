export type AppRelease = {
  version: string
  buildSha: string
}

const injectedVersion =
  typeof __APP_VERSION__ === "undefined" ? "0.0.0" : __APP_VERSION__
const injectedBuildSha =
  typeof __BUILD_SHA__ === "undefined" ? "unknown" : __BUILD_SHA__

export const appRelease: AppRelease = {
  version: injectedVersion,
  buildSha: injectedBuildSha,
}

export function formatRelease({ version, buildSha }: AppRelease): string {
  return `v${version} · ${buildSha.slice(0, 7)}`
}
