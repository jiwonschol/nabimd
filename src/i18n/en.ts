import type { TextKey } from "./ko"

/** English screen text. Same keys as `ko.ts`; a missing key fails typecheck. */
export const en: Readonly<Record<TextKey, string>> = {
  "meta.title": "Nabi Markdown — write one document in Markdown",
  "meta.description":
    "Practice writing real documents in Markdown. No sign-in; start right away.",

  "header.home": "Nabi Markdown home",
  "lang.toggle": "한국어",
  "lang.toggleLabel": "한국어로 보기",

  "home.headline": "Practice by writing real documents in Markdown.",
  "home.lead":
    "No sign-in; start right away. The marks you learn stay in this browser.",
  "home.start": "Start today’s five",
  "home.mapHeading": "Twelve marks",
  "home.loading": "Loading documents…",
  "home.loadFailed": "The documents did not load. Reload the page to try again.",

  "mark.heading": "Heading",
  "mark.bold": "Bold",
  "mark.italic": "Italic",
  "mark.unordered-list": "Bulleted list",
  "mark.ordered-list": "Numbered list",
  "mark.link": "Link",
  "mark.inline-code": "Inline code",
  "mark.code-block": "Code block",
  "mark.blockquote": "Blockquote",
  "mark.image": "Image",
  "mark.table": "Table",
  "mark.task-list": "Task list",
  "markExample.link": "[text](url)",
  "markExample.image": "![alt](url)",
  "markState.new": "Not tried",
  "markState.tried": "Tried",
  "markState.familiar": "Familiar",
  "markState.unavailable": "No documents yet",
  "mark.cellLabel": "{name} — {state}",
  "mark.separator": " · ",

  "footer.source": "Source code",
  "footer.licenses": "Third-party licenses",
  "footer.version": "Version {version}",
  "footer.newTab": "opens in a new tab",

  "practice.home": "Home",
  "practice.runProgress": "Today’s five {current}/{total}",
  "practice.another": "Another document",
  "practice.instructionMarks": "This time:",
  "practice.target": "Goal",
  "practice.editor": "Your Markdown",
  "practice.mine": "What you wrote",
  "practice.answer": "Answer source",
  "practice.loading": "Loading documents…",
  "practice.empty": "There is no document for this mark yet.",

  "editor.placeholder": "Write Markdown here",
  "editor.escapeHint": "Press Escape, then Tab to leave the editor.",
  "editor.blankPage": "Start from a blank page",
  "editor.invisibles": "Show spaces",
  "editor.options": "Editor options",

  "bar.hint": "Hint",
  "bar.hintMore": "More hint",
  "bar.hintClose": "Hide hint",
  "bar.showAnswer": "Show answer",
  "bar.check": "Check",
  "bar.next": "Next document",
  "bar.finish": "Finish the five",

  "verdict.pass": "Passed — you wrote the {marks} mark correctly.",
  "verdict.lineOne": "Line {line}",
  "verdict.lineRange": "Lines {from}–{to}",
  "verdict.withLines": "{where}: {message}",
  "hint.marks": "Marks to use: {marks}",

  "engine.list-bullet-space":
    "Put one space after each bullet marker, for example `- Item`.",
  "engine.list-number-space":
    "Put one space after each numbered marker, for example `1. Step`.",

  "location.document": "Document",
  "location.document-title": "Document title",
  "location.section": "In “{heading}”",

  "render.image": "[Image: {alt}]",
  "render.imageFallback": "image",
  "render.taskDone": "Done task",
  "render.taskOpen": "Open task",

  "done.title": "You wrote five documents.",
  "done.again": "Five more",
  "done.home": "Home",

  "done.empty": "Finish today’s five and they will be gathered here.",
  "done.firstTry": "Passed on the first try: {count}",
  "done.newMarks": "Marks tried for the first time: {marks}",
  "done.familiarMarks": "Marks now familiar: {marks}",
  "done.cardSource": "{title} — your Markdown",
  "done.cardRender": "{title} — rendered",
  "done.note": "Leave a note",

  "feedback.lead": "Found a bug, have an improvement, or want to share how it felt?",
  "feedback.label": "Bug report, improvement, or impression",
  "feedback.placeholder": "What should we know?",
  "feedback.privacy":
    "We keep your note, the app version and this bundle’s pass count for up to 90 days. Your answers and IP address are not stored with the note.",
  "feedback.send": "Send note",
  "feedback.sending": "Sending…",
  "feedback.sent": "Your note was sent. Thank you.",
  "feedback.limited": "Too many notes came from this network. Try again in a minute.",
  "feedback.error": "We couldn’t confirm whether your note was sent. Your text is still here.",
  "feedback.count": "{count} / {max}",

  "settings.open": "Settings",
  "settings.clear": "Clear progress",
  "settings.clearConfirm": "This removes all progress kept in this browser.",
  "settings.clearYes": "Clear it",
  "settings.clearNo": "Keep it",
  "settings.cleared": "Progress cleared.",
  "sound.on": "Sound on",
  "sound.off": "Sound off",
  "sound.label": "Sound effects",

  "footer.cookies": "Cookie settings",
  "consent.title": "Cookie settings",
  "consent.body":
    "This app stores your language, progress, sound setting and what you choose in this window in your browser. If you agree, it also turns on visitor statistics that count, in aggregate, which countries visits come from, how they arrive and which screens are viewed.",
  "consent.choose": "Choose items",
  "consent.need": "Necessary",
  "consent.needNote":
    "Stores your language (onsoon-lang), progress (nabimd.learning.v1), this choice (nabimd.consent.v1) and sound setting (nabimd.sound-muted). Always on.",
  "consent.stats": "Visitor statistics",
  "consent.statsNote":
    "Counts countries, referrers and screen views in aggregate, using Cloudflare Web Analytics.",
  "consent.reject": "Necessary only",
  "consent.accept": "Accept all",
  "consent.save": "Save my choices",

  "error.title": "Something went wrong.",
  "error.lead":
    "Nabi Markdown stopped before it could finish drawing this page. Your progress is still here.",
  "error.retry": "Try again",
  "error.reload": "Reload",
  "error.details": "Technical detail",
  "error.name": "Error",
  "error.message": "Detail",
  "error.problem": "Document",
  "error.build": "Build",
  "error.none": "(none)",
  "error.report": "Report this on GitHub",
  "error.reportNote":
    "The form opens with the technical detail filled in. The field for the Markdown you typed starts empty; paste it only if you are happy for it to be public.",
}
