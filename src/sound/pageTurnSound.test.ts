import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  preload = ""
  volume = 1
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
    const { PAGE_TURN_SOUND_ASSET, playPageTurnSound } = await import(
      "./pageTurnSound"
    )
    const { SOUND_VOLUME } = await import("./feedbackSound")

    playPageTurnSound()

    expect(PAGE_TURN_SOUND_ASSET).toContain("nabi-page-turn.mp3")
    expect(audio.preload).toBe("auto")
    expect(audio.currentTime).toBe(0)
    expect(audio.volume).toBe(SOUND_VOLUME)
    expect(audio.play).toHaveBeenCalledTimes(1)
  })

  it("shares the existing feedback-sound mute preference", async () => {
    window.localStorage.setItem("nabimd.sound-muted", "true")
    const { playPageTurnSound } = await import("./pageTurnSound")

    playPageTurnSound()

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("swallows browser playback rejection", async () => {
    audio.play.mockImplementationOnce(() => Promise.reject(new Error("blocked")))
    const { playPageTurnSound } = await import("./pageTurnSound")

    expect(() => playPageTurnSound()).not.toThrow()
    await Promise.resolve()
  })
})
