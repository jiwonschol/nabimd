export type ChangelogEntry = {
  date: string
  title: string
  items: readonly string[]
}

export const changelogEntries: readonly ChangelogEntry[] = [
  {
    date: "August 2026",
    title: "Release details and reporting",
    items: [
      "The landing page now shows the app version and build identifier.",
      "Bug reports and security reports now have clear, separate paths.",
    ],
  },
  {
    date: "July 2026",
    title: "A calmer practice workspace",
    items: [
      "Practice now focuses on one Markdown pattern at a time.",
      "Three frequency-based levels focus practice on useful Markdown syntax.",
    ],
  },
]
