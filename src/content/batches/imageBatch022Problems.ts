import type { NormalizedProblem } from "../types"

export const imageBatch022Id = "2026-08-28-l1-images-022"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

const teaching = {
  concept:
    "A Markdown image adds a picture and describes it with useful alternative text.",
  howTo:
    "Type an exclamation mark, put the image description in square brackets, and put the image address in parentheses.",
  example:
    "Remember the view: ![Sunrise over the lake](https://example.com/images/lake-sunrise.jpg).",
} as const

const hints = [
  "Start the image with an exclamation mark followed by an opening square bracket.",
  "Put a useful description inside the brackets and the image address inside parentheses.",
  "Example: `![Sunrise over the lake](https://example.com/images/lake-sunrise.jpg)`",
] as const

export type ImageBatch022Input = {
  id: string
  contentVariant: string
  target: string
  plainText: string
  vocabularyDomain: string
  terms: readonly [string, string]
}

export const imageBatch022Inputs: readonly ImageBatch022Input[] = [
  {
    id: "l1-image-rainy-window",
    contentVariant: "rainy-window-photo",
    target:
      "Remember the weather: ![Raindrops on the window](https://example.com/images/rainy-window.jpg).",
    plainText: "Remember the weather: Raindrops on the window.",
    vocabularyDomain: "everyday-weather",
    terms: ["raindrops", "window"],
  },
  {
    id: "l1-image-red-bicycle",
    contentVariant: "red-bicycle-photo",
    target:
      "Add the photo: ![A red bicycle by the fence](https://example.com/images/red-bicycle.jpg).",
    plainText: "Add the photo: A red bicycle by the fence.",
    vocabularyDomain: "neighborhood-travel",
    terms: ["bicycle", "fence"],
  },
  {
    id: "l1-image-picnic-basket",
    contentVariant: "picnic-basket-photo",
    target:
      "Share this memory: ![A picnic basket on the grass](https://example.com/images/picnic-basket.jpg).",
    plainText: "Share this memory: A picnic basket on the grass.",
    vocabularyDomain: "outdoor-meals",
    terms: ["picnic", "basket"],
  },
  {
    id: "l1-image-library-corner",
    contentVariant: "library-corner-photo",
    target:
      "Save this spot: ![A sunny reading corner](https://example.com/images/library-corner.jpg).",
    plainText: "Save this spot: A sunny reading corner.",
    vocabularyDomain: "public-library",
    terms: ["reading", "corner"],
  },
  {
    id: "l1-image-garden-path",
    contentVariant: "garden-path-photo",
    target:
      "Keep the view: ![A stone path through flowers](https://example.com/images/garden-path.jpg).",
    plainText: "Keep the view: A stone path through flowers.",
    vocabularyDomain: "home-garden",
    terms: ["path", "flowers"],
  },
  {
    id: "l1-image-birthday-cake",
    contentVariant: "birthday-cake-photo",
    target:
      "Add the celebration: ![A birthday cake with candles](https://example.com/images/birthday-cake.jpg).",
    plainText: "Add the celebration: A birthday cake with candles.",
    vocabularyDomain: "family-celebrations",
    terms: ["birthday", "candles"],
  },
  {
    id: "l1-image-beach-sunrise",
    contentVariant: "beach-sunrise-photo",
    target:
      "Share the morning: ![Sunrise above a quiet beach](https://example.com/images/beach-sunrise.jpg).",
    plainText: "Share the morning: Sunrise above a quiet beach.",
    vocabularyDomain: "coastal-travel",
    terms: ["sunrise", "beach"],
  },
  {
    id: "l1-image-sleepy-cat",
    contentVariant: "sleepy-cat-photo",
    target:
      "Post this: ![A sleepy cat on a blue chair](https://example.com/images/sleepy-cat.jpg).",
    plainText: "Post this: A sleepy cat on a blue chair.",
    vocabularyDomain: "home-pets",
    terms: ["cat", "chair"],
  },
  {
    id: "l1-image-soup-bowl",
    contentVariant: "soup-bowl-photo",
    target:
      "Add the meal: ![A warm bowl of tomato soup](https://example.com/images/tomato-soup.jpg).",
    plainText: "Add the meal: A warm bowl of tomato soup.",
    vocabularyDomain: "everyday-meals",
    terms: ["tomato", "soup"],
  },
  {
    id: "l1-image-city-bus",
    contentVariant: "city-bus-photo",
    target:
      "Travel note: ![A green bus at the station](https://example.com/images/city-bus.jpg).",
    plainText: "Travel note: A green bus at the station.",
    vocabularyDomain: "local-travel",
    terms: ["bus", "station"],
  },
  {
    id: "l1-image-hiking-trail",
    contentVariant: "hiking-trail-photo",
    target:
      "Save the route: ![A forest trail beside a stream](https://example.com/images/hiking-trail.jpg).",
    plainText: "Save the route: A forest trail beside a stream.",
    vocabularyDomain: "outdoor-walks",
    terms: ["trail", "stream"],
  },
  {
    id: "l1-image-paper-lanterns",
    contentVariant: "paper-lanterns-photo",
    target:
      "Share the evening: ![Paper lanterns above the street](https://example.com/images/paper-lanterns.jpg).",
    plainText: "Share the evening: Paper lanterns above the street.",
    vocabularyDomain: "community-events",
    terms: ["lanterns", "street"],
  },
] as const

function createImageProblem(input: ImageBatch022Input): NormalizedProblem {
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "images",
    skillIds: ["inline-image"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching,
    syntaxTokens: ["![", "Alt text", "](", "Image address", ")"],
    title: "Markdown image",
    prompt: "Write the short note with one Markdown image.",
    target: input.target,
    starterText: "",
    protectedContent: [input.plainText],
    matchChecks: [
      {
        id: "use-image",
        kind: "inline-presence",
        scope: documentScope,
        inline: "image",
        min: 1,
        priority: 10,
        feedback:
          "Add a Markdown image with an exclamation mark, description, and image address.",
      },
    ],
    editorialChecks: [
      {
        id: "keep-one-image",
        kind: "max-inline-count",
        scope: documentScope,
        inline: "image",
        max: 1,
        review: "Keep this short note focused on one image.",
      },
    ],
    hints,
    retryFamily: "level-1-image",
    reviewTags: ["one-focused-image", "meaningful-alt-text"],
    vocabulary: {
      profile: "everyday",
      domains: [input.vocabularyDomain],
      terms: input.terms,
    },
    sourceBatchId: imageBatch022Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const imageBatch022Problems: readonly NormalizedProblem[] =
  imageBatch022Inputs.map(createImageProblem)
