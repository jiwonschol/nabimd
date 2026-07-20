type BookSpineProps = {
  testId: "landing-book-spine" | "practice-book-spine" | "summary-book-spine"
}

export function BookSpine({ testId }: BookSpineProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="book-spine"
      data-testid={testId}
      src="/images/nabi-book-spine.png"
    />
  )
}
