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

const STORAGE_PROBE_PREFIX = "__nabimd_session_storage_probe__"
const STORAGE_PROBE_VALUE = "available"
const MAX_PROBE_KEY_ATTEMPTS = 10
let storageProbeSequence = 0

function findUnusedProbeKey(storage: Storage): string | null {
  for (let attempt = 0; attempt < MAX_PROBE_KEY_ATTEMPTS; attempt += 1) {
    const timestamp = Date.now().toString(36)
    const probeKey = `${STORAGE_PROBE_PREFIX}:${timestamp}:${storageProbeSequence++}`
    if (storage.getItem(probeKey) === null) return probeKey
  }

  return null
}

function canUseStorage(storage: Storage): boolean {
  let probeKey: string | null = null
  let wroteProbe = false

  try {
    probeKey = findUnusedProbeKey(storage)
    if (probeKey === null) return false

    storage.setItem(probeKey, STORAGE_PROBE_VALUE)
    wroteProbe = true
    if (storage.getItem(probeKey) !== STORAGE_PROBE_VALUE) return false

    storage.removeItem(probeKey)
    if (storage.getItem(probeKey) !== null) return false

    wroteProbe = false
    return true
  } catch {
    return false
  } finally {
    if (probeKey !== null && wroteProbe) {
      try {
        storage.removeItem(probeKey)
      } catch {
        // The unusable candidate cannot guarantee cleanup.
      }
    }
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
