import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { RankingClient } from "../ranking/rankingClient"
import { RunSummary } from "./RunSummary"

function renderSummary(
  rankingClient: RankingClient,
  failedProblemIds: string[] = [],
) {
  render(
    <RunSummary
      elapsedMs={65_000}
      failedProblemIds={failedProblemIds}
      level={1}
      levelLabel="Level 1 — Learn the syntax"
      onChangeLevel={vi.fn()}
      onPracticeAgain={vi.fn()}
      onStartOver={vi.fn()}
      rankingClient={rankingClient}
      score={failedProblemIds.length ? 5 : 6}
      total={6}
    />,
  )
}

describe("RunSummary", () => {
  it("shows score, frozen time, collecting status, and replay actions", async () => {
    const getStanding = vi.fn().mockResolvedValue({ kind: "collecting" })
    renderSummary({ getStanding })

    expect(screen.getByRole("heading", { name: "Practice complete." })).toBeVisible()
    expect(screen.getByLabelText("Score")).toHaveTextContent("6 / 6")
    expect(screen.getByLabelText("Total time")).toHaveTextContent("01:05")
    expect(screen.getByRole("button", { name: "Practice again" })).toHaveFocus()
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()

    await waitFor(() => expect(getStanding).toHaveBeenCalledOnce())
    expect(screen.getByLabelText("Level standing")).toHaveTextContent(
      "Collecting data",
    )
    expect(screen.getByText(/Your time only/)).toBeVisible()
  })

  it("groups failed syntax by family without exposing prose differences", async () => {
    renderSummary(
      { getStanding: vi.fn().mockResolvedValue({ kind: "collecting" }) },
      ["l1-heading-apple", "l1-heading-rainy-day"],
    )

    expect(screen.getByRole("heading", { name: "Syntax to revisit" })).toBeVisible()
    expect(screen.getAllByRole("listitem", { name: /Syntax reminder/ })).toHaveLength(1)
    expect(screen.queryByText(/spelling/i)).not.toBeInTheDocument()
  })

  it("renders a future percentile result and falls back after client failure", async () => {
    const percentile = vi.fn().mockResolvedValue({
      kind: "percentile",
      sampleSize: 240,
      topPercent: 18,
    })
    const { unmount } = render(
      <RunSummary
        elapsedMs={12_000}
        failedProblemIds={[]}
        level={2}
        levelLabel="Level 2 — Rebuild real documents"
        onChangeLevel={vi.fn()}
        onPracticeAgain={vi.fn()}
        onStartOver={vi.fn()}
        rankingClient={{ getStanding: percentile }}
        score={6}
        total={6}
      />,
    )
    expect(await screen.findByText("About top 18%" )).toBeVisible()
    expect(screen.getByText("Compared with 240 anonymous turns")).toBeVisible()
    unmount()

    renderSummary({ getStanding: vi.fn().mockRejectedValue(new Error("offline")) })
    expect(await screen.findByText("Collecting data")).toBeVisible()
  })
})
