export const SUCCESS_SOUND_ASSET = "/audio/success.ogg"

const SOUND_MUTED_KEY = "nabimd.sound-muted"

let audio: HTMLAudioElement | null = null
let unlocked = false
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
  if (unlocked) return
  unlocked = true
  removeGestureUnlockListeners()

  const sound = getAudio()
  if (!sound) return

  const wasMuted = sound.muted
  sound.muted = true
  sound.currentTime = 0
  const playback = sound.play()
  sound.pause()
  sound.currentTime = 0
  sound.muted = wasMuted
  swallowPlaybackRejection(playback)
}

export function playSuccessSound() {
  if (!unlocked || readSoundMuted()) return

  const sound = getAudio()
  if (!sound) return

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
    once: true,
  })
  document.addEventListener("keydown", unlockFromGesture, {
    capture: true,
    once: true,
  })
}

installGestureUnlockListeners()
