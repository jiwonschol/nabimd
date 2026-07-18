function createVolatileStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

const STORAGE_PROBE_KEY = "__nabimd_session_storage_probe__"
const STORAGE_PROBE_VALUE = "available"

function canUseStorage(storage: Storage): boolean {
  try {
    storage.setItem(STORAGE_PROBE_KEY, STORAGE_PROBE_VALUE)
    if (storage.getItem(STORAGE_PROBE_KEY) !== STORAGE_PROBE_VALUE) {
      storage.removeItem(STORAGE_PROBE_KEY)
      return false
    }

    storage.removeItem(STORAGE_PROBE_KEY)
    return storage.getItem(STORAGE_PROBE_KEY) === null
  } catch {
    try {
      storage.removeItem(STORAGE_PROBE_KEY)
    } catch {
      // The candidate is unusable; best-effort cleanup cannot be guaranteed.
    }
    return false
  }
}

export function resolveBrowserStorage(): Storage {
  try {
    const storage = window.sessionStorage
    if (canUseStorage(storage)) return storage
  } catch {
    // Accessing sessionStorage itself may be blocked.
  }

  return createVolatileStorage()
}
