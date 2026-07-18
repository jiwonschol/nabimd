# GPT-5.6 curriculum generation prompt

Generate a staged English-first Markdown curriculum artifact for Nabi Markdown.
Produce exactly 16 short US-English exercises for each of these eight common
Devpost Markdown families: headings, emphasis, lists, blockquotes, inline code,
horizontal rules, links, and images.

Return one JSON object with this exact shape:

```text
{
  "schemaVersion": 1,
  "generatedBy": "gpt-5.6",
  "generatedOn": "YYYY-MM-DD",
  "promptFile": "curriculum/problem-bank/generation-prompt.md",
  "families": [
    {
      "id": "headings | emphasis | lists | blockquotes | inline-code | horizontal-rules | links | images",
      "engineSupported": true | false,
      "teaching": {
        "concept": "nonblank string",
        "howTo": "nonblank string",
        "example": "nonblank string"
      },
      "defaults": {
        "expectedSkill": "nonblank string",
        "likelyMalformedTrap": "nonblank string",
        "editorialNote": "nonblank string"
      },
      "candidates": [
        {
          "id": "stable-kebab-case-id",
          "text": "nonblank learner-facing string",
          "targetMarkdown": "nonblank Markdown string",
          "expectedSkill": "optional nonblank override",
          "likelyMalformedTrap": "optional nonblank override",
          "editorialNote": "optional nonblank override"
        }
      ]
    }
  ]
}
```

Include each family exactly once and exactly 16 candidates per family. Only the
`headings` family sets `engineSupported` to `true`; all others set it to
`false`. Candidate IDs must be globally unique. When a candidate omits an
optional metadata field, normalization inherits the matching value from its
family's `defaults`. When present, an override replaces that default and must
be a nonblank string.

For every candidate, provide a stable kebab-case ID, concise learner-facing
text, and the intended Markdown target. Give every family a reusable concept,
how-to, and inline example. Prefer familiar subjects and natural American
educational copy. Use official destinations for links and reserved local asset
paths with descriptive alt text for images. A horizontal-rule target must
preserve prose on both sides of the rule. Do not use exact-string grading
assumptions. The current engine supports only top-level hash H1 headings.

This is generation input, not publication approval. Preserve unsupported
candidates for later engine work, but do not put them in the runtime bank.
Every publishable candidate must later pass the real fixture engine, two
declared-independent digest-bound reviews, and the editorial queue.
