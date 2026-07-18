type WordmarkProps = {
  onHome?: () => void
}

function WordmarkContents() {
  return (
    <>
      <span aria-hidden="true" className="wordmark__mark">
        <img
          alt=""
          height="128"
          src="/brand/bfly-wordmark.png"
          width="128"
        />
      </span>
      <span>Nabi Markdown</span>
    </>
  )
}

export function Wordmark({ onHome }: WordmarkProps) {
  return (
    <h1 className="wordmark">
      {onHome ? (
        <button
          aria-label="Nabi Markdown home"
          className="wordmark__home"
          onClick={onHome}
          type="button"
        >
          <WordmarkContents />
        </button>
      ) : (
        <WordmarkContents />
      )}
    </h1>
  )
}
