import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  muted = false
  preload = ""
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())

  constructor(public src: string) {}
}

function createDeferredPlayback() {
  let reject: (reason?: unknown) => void = () => {}
  let resolve: () => void = () => {}
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

async function flushPlayback() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("feedbackSound", () => {
  let audio: FakeAudio

  beforeEach(() => {
    vi.resetModules()
    audio = new FakeAudio("")
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
    const { __resetFeedbackSoundForTesting } = await import("./feedbackSound")
    __resetFeedbackSoundForTesting(false)
    vi.unstubAllGlobals()
  })

  it("ignores playback before a user gesture unlocks sound", async () => {
    const { playFeedbackSound } = await import("./feedbackSound")

    playFeedbackSound("matched")

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("primes the audio silently when sound is unlocked", async () => {
    const { unlockFeedbackSound } = await import("./feedbackSound")

    unlockFeedbackSound()
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(audio.muted).toBe(false)
  })

  it("unlocks sound from the first pointer gesture", async () => {
    const { playFeedbackSound } = await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playFeedbackSound("matched")
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("plays once after sound has been unlocked", async () => {
    const { playFeedbackSound, unlockFeedbackSound } = await import(
      "./feedbackSound"
    )

    unlockFeedbackSound()
    await flushPlayback()
    playFeedbackSound("matched")

    expect(audio.play).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)
    expect(audio.muted).toBe(false)
  })

  it("switches among matched, retry, and summary assets on one audio channel", async () => {
    const {
      FEEDBACK_SOUND_ASSETS,
      playFeedbackSound,
      unlockFeedbackSound,
    } = await import("./feedbackSound")

    unlockFeedbackSound()
    await flushPlayback()
    playFeedbackSound("retry")
    expect(audio.src).toBe(FEEDBACK_SOUND_ASSETS.retry)

    playFeedbackSound("summary")
    expect(audio.src).toBe(FEEDBACK_SOUND_ASSETS.summary)

    playFeedbackSound("matched")
    expect(audio.src).toBe(FEEDBACK_SOUND_ASSETS.matched)
  })

  it("suppresses playback when muted", async () => {
    const { playFeedbackSound, setSoundMuted, unlockFeedbackSound } =
      await import("./feedbackSound")

    unlockFeedbackSound()
    await flushPlayback()
    setSoundMuted(true)
    playFeedbackSound("matched")

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem("nabimd.sound-muted")).toBe("true")
  })

  it("immediately silences and resets cached audio when muted", async () => {
    const { playFeedbackSound, setSoundMuted, unlockFeedbackSound } =
      await import("./feedbackSound")

    unlockFeedbackSound()
    await flushPlayback()
    playFeedbackSound("matched")
    audio.currentTime = 0.25

    setSoundMuted(true)

    expect(audio.muted).toBe(true)
    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)

    setSoundMuted(false)

    expect(audio.muted).toBe(false)
  })

  it("retries priming on a later gesture after the first attempt is rejected", async () => {
    const firstPriming = createDeferredPlayback()
    audio.play
      .mockReturnValueOnce(firstPriming.promise)
      .mockReturnValueOnce(Promise.resolve())
    const { playFeedbackSound } = await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    firstPriming.reject(new Error("blocked"))
    await flushPlayback()

    document.dispatchEvent(new Event("keydown", { bubbles: true }))
    await flushPlayback()
    playFeedbackSound("matched")

    expect(audio.play).toHaveBeenCalledTimes(3)
  })

  it("clears a queued verdict when priming is rejected", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    const { playFeedbackSound } = await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playFeedbackSound("matched")
    priming.reject(new Error("blocked"))
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(1)
  })

  it("does not play a verdict before asynchronous priming succeeds", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    const { playFeedbackSound } = await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playFeedbackSound("matched")

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.pause).not.toHaveBeenCalled()

    priming.resolve()
    await flushPlayback()
  })

  it("does not start concurrent priming from another gesture", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    document.dispatchEvent(new Event("keydown", { bubbles: true }))

    expect(audio.play).toHaveBeenCalledTimes(1)

    priming.resolve()
    await flushPlayback()
  })

  it("plays one pending matched verdict after priming succeeds", async () => {
    const priming = createDeferredPlayback()
    audio.play
      .mockReturnValueOnce(priming.promise)
      .mockReturnValueOnce(Promise.resolve())
    const { playFeedbackSound } = await import("./feedbackSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playFeedbackSound("matched")

    expect(audio.play).toHaveBeenCalledTimes(1)

    priming.resolve()
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("restores the stored mute preference", async () => {
    window.localStorage.setItem("nabimd.sound-muted", "true")

    const { readSoundMuted } = await import("./feedbackSound")

    expect(readSoundMuted()).toBe(true)
  })

  it("swallows a browser playback rejection", async () => {
    audio.play.mockReturnValueOnce(Promise.reject(new Error("blocked")))
    const { playFeedbackSound, unlockFeedbackSound } = await import(
      "./feedbackSound"
    )

    unlockFeedbackSound()
    await flushPlayback()

    expect(() => playFeedbackSound("matched")).not.toThrow()
  })
})
