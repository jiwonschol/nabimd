/**
 * 한국어 화면 문구. 컴포넌트는 문구를 직접 쓰지 않고 이 사전의 키를 읽는다
 * (계획서 §4.4). 문장은 "~다"로 끝낸다(onsoonlabs intend.md — 해요체 금지,
 * 부탁은 서술문으로). `{이름}` 자리는 `formatText`가 채운다.
 *
 * 영어 사전(`en.ts`)은 이 객체와 같은 키를 가져야 하고, 빠진 키는 타입 검사가
 * 잡는다.
 */
export const ko = {
  "meta.title": "Nabi Markdown — 마크다운으로 문서 한 장 쓰기",
  "meta.description":
    "실제 문서를 마크다운으로 직접 써 보는 연습이다. 로그인 없이 바로 시작한다.",

  "header.home": "Nabi Markdown 홈",
  "lang.toggle": "English",
  "lang.toggleLabel": "Switch to English",

  "home.headline": "실제 문서를 마크다운으로 직접 써 보는 연습이다.",
  "home.lead": "로그인 없이 바로 시작한다. 배운 기호는 이 브라우저에 남는다.",
  "home.start": "오늘의 다섯 장 시작",
  "home.mapHeading": "기호 열두 개",
  "home.loading": "문서를 불러오는 중이다.",
  "home.loadFailed": "문서를 불러오지 못했다. 새로고침하면 다시 불러온다.",

  "mark.heading": "제목",
  "mark.bold": "굵게",
  "mark.italic": "기울임",
  "mark.unordered-list": "목록",
  "mark.ordered-list": "번호 목록",
  "mark.link": "링크",
  "mark.inline-code": "코드",
  "mark.code-block": "코드 블록",
  "mark.blockquote": "인용",
  "mark.image": "이미지",
  "mark.table": "표",
  "mark.task-list": "할 일 목록",
  "markExample.link": "[글](주소)",
  "markExample.image": "![설명](주소)",
  "markState.new": "안 해봄",
  "markState.tried": "해봄",
  "markState.familiar": "익숙함",
  "markState.unavailable": "문서 준비 중",
  "mark.cellLabel": "{name} — {state}",
  "mark.separator": " · ",

  "footer.source": "소스 코드",
  "footer.licenses": "제3자 라이선스",
  "footer.version": "버전 {version}",
  "footer.newTab": "새 탭에서 열린다",

  "practice.home": "홈으로",
  "practice.runProgress": "오늘의 다섯 장 {current}/{total}",
  "practice.another": "다른 장",
  "practice.instructionMarks": "이번 기호:",
  "practice.target": "목표",
  "practice.editor": "내 마크다운",
  "practice.mine": "내가 쓴 것",
  "practice.answer": "정답 소스",
  "practice.loading": "문서를 불러오는 중이다.",
  "practice.empty": "이 기호로 쓸 문서가 아직 없다.",

  "editor.placeholder": "여기에 마크다운을 쓴다",
  "editor.escapeHint": "Esc를 누른 뒤 Tab을 누르면 에디터 밖으로 나간다.",
  "editor.blankPage": "빈 종이에서 쓰기",
  "editor.invisibles": "공백 보기",
  "editor.options": "에디터 설정",

  "bar.hint": "힌트",
  "bar.hintMore": "힌트 더",
  "bar.hintClose": "힌트 닫기",
  "bar.showAnswer": "정답 보기",
  "bar.check": "확인",
  "bar.next": "다음 장",
  "bar.finish": "다섯 장 끝",

  "verdict.pass": "통과 — {marks} 기호를 바르게 썼다.",
  "verdict.lineOne": "{line}번째 줄",
  "verdict.lineRange": "{from}~{to}번째 줄",
  "verdict.withLines": "{where}: {message}",
  "hint.marks": "쓸 기호: {marks}",

  "engine.list-bullet-space":
    "목록 기호 뒤에는 공백 하나를 둔다. 예: `- 항목`",
  "engine.list-number-space": "번호 뒤에는 공백 하나를 둔다. 예: `1. 단계`",

  "location.document": "문서",
  "location.document-title": "문서 제목",
  "location.section": "“{heading}” 구간",

  "render.image": "[이미지: {alt}]",
  "render.imageFallback": "이미지",

  "done.title": "다섯 장을 썼다.",
  "done.again": "다섯 장 더",
  "done.home": "홈",

  "done.empty": "오늘의 다섯 장을 끝내면 여기에 정리된다.",
  "done.firstTry": "한 번에 통과한 장: {count}장",
  "done.newMarks": "새로 해본 기호: {marks}",
  "done.familiarMarks": "익숙해진 기호: {marks}",
  "done.cardSource": "{title} — 쓴 마크다운",
  "done.cardRender": "{title} — 렌더",
  "done.note": "메모 남기기",

  "feedback.lead": "버그, 고칠 점, 써 본 느낌을 남긴다.",
  "feedback.label": "버그, 고칠 점, 느낌",
  "feedback.placeholder": "무엇이든 적는다",
  "feedback.privacy":
    "메모와 앱 버전, 이번 묶음의 통과 수를 90일까지 보관한다. 쓴 답과 IP 주소는 메모와 함께 저장하지 않는다.",
  "feedback.send": "메모 보내기",
  "feedback.sending": "보내는 중이다",
  "feedback.sent": "메모를 받았다. 고맙다.",
  "feedback.limited": "이 네트워크에서 메모가 너무 많이 왔다. 1분 뒤에 다시 보낸다.",
  "feedback.error": "보내졌는지 확인하지 못했다. 쓴 글은 그대로 있다.",
  "feedback.count": "{count} / {max}",

  "settings.open": "설정",
  "settings.clear": "진도 지우기",
  "settings.clearConfirm": "이 브라우저에 남은 진도를 모두 지운다.",
  "settings.clearYes": "지운다",
  "settings.clearNo": "그대로 둔다",
  "settings.cleared": "진도를 지웠다.",
  "sound.on": "소리 켜짐",
  "sound.off": "소리 꺼짐",
  "sound.label": "효과음",

  "footer.cookies": "쿠키 설정",
  "consent.title": "쿠키 설정",
  "consent.body":
    "이 앱은 고른 언어, 진도, 소리 설정, 이 창에서 고른 내용을 이 브라우저에 저장한다. 동의하면 여기에 더해 어느 나라에서 어떤 경로로 들어와 어느 화면을 보는지 합계로 세는 방문 통계를 켠다.",
  "consent.choose": "항목 고르기",
  "consent.need": "필수",
  "consent.needNote":
    "언어(onsoon-lang), 진도(nabimd.learning.v1), 이 선택(nabimd.consent.v1), 소리 설정(nabimd.sound-muted)을 저장한다. 끌 수 없다.",
  "consent.stats": "방문 통계",
  "consent.statsNote":
    "나라, 유입 경로, 화면별 방문 수를 합계로 센다. Cloudflare Web Analytics를 쓴다.",
  "consent.reject": "필수만 허용",
  "consent.accept": "모두 동의",
  "consent.save": "선택한 대로 저장",

  "error.title": "화면을 그리다 멈췄다.",
  "error.lead":
    "Nabi Markdown이 이 화면을 끝까지 그리지 못했다. 쌓은 진도는 그대로 있다.",
  "error.retry": "다시 시도",
  "error.reload": "새로고침",
  "error.details": "기술 정보",
  "error.name": "오류",
  "error.message": "내용",
  "error.problem": "문서",
  "error.build": "빌드",
  "error.none": "(없음)",
  "error.report": "GitHub에 알리기",
  "error.reportNote":
    "양식에 기술 정보가 채워져 열린다. 쓴 마크다운을 붙이는 칸은 비어 있고, 공개되어도 괜찮을 때만 붙인다.",
} as const

export type TextKey = keyof typeof ko
