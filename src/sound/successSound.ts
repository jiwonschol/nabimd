export const SUCCESS_SOUND_ASSET = "/audio/success.ogg"

const SOUND_MUTED_KEY = "nabimd.sound-muted"

let audio: HTMLAudioElement | null = null
let unlocked = false
let priming: Promise<void> | null = null
let pendingPlayback = false
let soundMuted: boolean | undefined
const muteListeners = new Set<(muted: boolean) => void>()

let removeGestureUnlockListeners = () => {}

function readStoredSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(SOUND_MUTED_KEY) === "true"
  } catch {
    return false
  }
}

function getAudio(): HTMLAudioElement | null {
  if (audio) return audio
  if (typeof Audio === "undefined") return null
  audio = new Audio(SUCCESS_SOUND_ASSET)
  return audio
}

function swallowPlaybackRejection(playback: Promise<void> | undefined) {
  void playback?.catch(() => {})
}

export function readSoundMuted(): boolean {
  soundMuted ??= readStoredSoundMuted()
  return soundMuted
}

export function setSoundMuted(muted: boolean) {
  soundMuted = muted
  if (audio) {
    audio.muted = muted || priming !== null
    if (muted) {
      audio.pause()
      audio.currentTime = 0
    }
  }
  try {
    window.localStorage.setItem(SOUND_MUTED_KEY, String(muted))
  } catch {
    // Sound preferences are optional when browser storage is unavailable.
  }
  muteListeners.forEach((listener) => listener(muted))
}

export function subscribeSoundMuted(listener: (muted: boolean) => void) {
  muteListeners.add(listener)
  return () => {
    muteListeners.delete(listener)
  }
}

export function unlockSuccessSound() {
  if (unlocked || priming) return

  const sound = getAudio()
  if (!sound) return

  sound.muted = true
  let playback: Promise<void>
  try {
    playback = Promise.resolve(sound.play())
  } catch {
    sound.muted = readSoundMuted()
    return
  }

  priming = playback
  void playback.then(
    () => {
      if (priming !== playback) return

      priming = null
      unlocked = true
      removeGestureUnlockListeners()
      sound.pause()
      sound.currentTime = 0
      sound.muted = readSoundMuted()

      const shouldPlayPendingVerdict = pendingPlayback
      pendingPlayback = false
      if (shouldPlayPendingVerdict) playSuccessSound()
    },
    () => {
      if (priming !== playback) return

      priming = null
      pendingPlayback = false
      sound.muted = readSoundMuted()
    },
  )
}

export function playSuccessSound() {
  if (!unlocked) {
    if (priming) pendingPlayback = true
    return
  }
  if (readSoundMuted()) return

  const sound = getAudio()
  if (!sound) return

  sound.muted = false
  sound.currentTime = 0
  swallowPlaybackRejection(sound.play())
}

function installGestureUnlockListeners() {
  if (typeof document === "undefined") return

  const unlockFromGesture = () => unlockSuccessSound()
  removeGestureUnlockListeners = () => {
    document.removeEventListener("pointerdown", unlockFromGesture, true)
    document.removeEventListener("keydown", unlockFromGesture, true)
  }
  document.addEventListener("pointerdown", unlockFromGesture, {
    capture: true,
  })
  document.addEventListener("keydown", unlockFromGesture, {
    capture: true,
  })
}

export function __resetSuccessSoundForTesting(
  reinstallGestureListeners = true,
) {
  removeGestureUnlockListeners()
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
  audio = null
  unlocked = false
  priming = null
  pendingPlayback = false
  soundMuted = undefined
  muteListeners.clear()
  removeGestureUnlockListeners = () => {}
  if (reinstallGestureListeners) installGestureUnlockListeners()
}

installGestureUnlockListeners()
