type NavigatorLike = {
  userAgentData?: { platform?: string }
  platform?: string
}

export function resolveCheckShortcut(navigatorLike: NavigatorLike) {
  const platform =
    navigatorLike.userAgentData?.platform ?? navigatorLike.platform ?? ""
  const isApplePlatform = /mac|iphone|ipad|ipod/i.test(platform)

  return isApplePlatform
    ? { label: "⌘↩", ariaKeyShortcuts: "Meta+Enter" }
    : { label: "Ctrl+↩", ariaKeyShortcuts: "Control+Enter" }
}
