import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  muted = false
  preload = ""
  volume = 1
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())
}

describe("pageTurnSound", () => {
  let audio: FakeAudio

  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    audio = new FakeAudio()
    vi.stubGlobal(
      "Audio",
      class {
        constructor() {
          return audio
        }
      },
    )
  })

  afterEach(async () => {
    const { __resetPageTurnSoundForTesting } = await import(
      "./pageTurnSound"
    )
    __resetPageTurnSoundForTesting()
    vi.unstubAllGlobals()
  })

  it("plays the real page-turn asset on an independent audio channel", async () => {
    const {
      PAGE_TURN_SOUND_ASSET,
      playPageTurnSound,
      unlockAndPlayPageTurnSound,
    } = await import("./pageTurnSound")
    const { SOUND_VOLUME } = await import("./feedbackSound")

    unlockAndPlayPageTurnSound()
    await Promise.resolve()
    playPageTurnSound()

    expect(PAGE_TURN_SOUND_ASSET).toContain("nabi-page-turn.mp3")
    expect(audio.preload).toBe("auto")
    expect(audio.currentTime).toBe(0)
    expect(audio.volume).toBe(SOUND_VOLUME)
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("does not attempt timer-driven playback before a gesture unlock", async () => {
    const { playPageTurnSound } = await import("./pageTurnSound")

    playPageTurnSound()

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("silently unlocks while muted and plays Summary after sound is enabled", async () => {
    window.localStorage.setItem("nabimd.sound-muted", "true")
    const { playPageTurnSound, unlockAndPlayPageTurnSound } = await import(
      "./pageTurnSound"
    )
    const { setSoundMuted } = await import("./feedbackSound")

    unlockAndPlayPageTurnSound()
    await Promise.resolve()
    await Promise.resolve()

    expect(audio.muted).toBe(true)
    expect(audio.play).toHaveBeenCalledOnce()
    expect(audio.pause).toHaveBeenCalledOnce()

    setSoundMuted(false)
    playPageTurnSound()

    expect(audio.muted).toBe(false)
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("stops an active page turn when the shared sound control is muted", async () => {
    const { unlockAndPlayPageTurnSound } = await import("./pageTurnSound")
    const { setSoundMuted } = await import("./feedbackSound")

    unlockAndPlayPageTurnSound()
    await Promise.resolve()
    setSoundMuted(true)

    expect(audio.muted).toBe(true)
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(audio.currentTime).toBe(0)
  })

  it("swallows browser playback rejection", async () => {
    audio.play.mockImplementationOnce(() => Promise.reject(new Error("blocked")))
    const { unlockAndPlayPageTurnSound } = await import("./pageTurnSound")

    expect(() => unlockAndPlayPageTurnSound()).not.toThrow()
    await Promise.resolve()
  })
})
