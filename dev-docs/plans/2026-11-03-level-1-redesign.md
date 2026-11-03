# Nabi Markdown Level 1 재설계 계획서 [SoT]

> **계획만. 구현·빌드는 승인 후 별도 세션에서 한다.**
> 작성 2026-11-03 · 바탕 진단: `docs/nabimd-assessment-2026-11-03.md` · 이 문서가 멀티세션 작업의 단일 정본(SoT)이다. 세션마다 §10의 상태 표와 확정된 결정을 갱신한다.
> 재진입: 이 문서 §10 → `git log --oneline -20` → `gh pr list --repo jiwonschol/nabimd` → 추적 이슈 #255 순으로 읽고 시작한다. 문서는 낡을 수 있으니 git이 정본이다.

## 0. 한 줄 목표

한국어 사용자가 onsoonlabs.com/nabimd/ 에 들어와 로그인 없이 5분 안에 **짧은 실제 문서 한 장을 마크다운으로 직접 써서 구조 채점을 받고**, 배운 기호가 다음 방문까지 남는 Level 1을 **흰 바탕의 새 화면**으로 다시 지어 배포한다. 채점 엔진·문제은행·배포 파이프라인은 살리고, 글자 상자 드릴·책 메타포·타이머·레벨 잠금은 버린다.

## 1. 범위 — 지시 전수 체크리스트

| # | Jiwon의 말 (2026-11-03) | 이 계획에서의 자리 |
|---|---|---|
| 1 | "nabimd는 다소 정체된 프로젝트인데, 조금 더 발전시켜봤으면 한다" | 전체 — B안(다시 정의하고 다시 짓기) 채택 |
| 2 | "기능을 포함해서 디자인이나 모든 면에서 나도 사실은 불만족스럽거든" | 기능(§4.1~4.6)과 디자인(§4.7~4.8) 둘 다 범위 |
| 3 | "B안 재설계" | 진단서의 B안 서술 전부가 범위: 엔진·문제은행·배포 유지, 연습 단위를 문서 한 장으로, 진짜 에디터, 책 메타포·페이지 넘김·타이머·레벨 잠금 제거, 진도는 브라우저에, 계측을 첫 PR에, AI 지시문 트랙은 다음 덩어리 |
| 4 | 언어: "한국어 우선, 영어 유지" | §4.3~4.4 — 화면 한국어·영어 전환, 새 Level 1 문제는 한국어로 새로, 기존 영어 문제은행은 영어 모드에 |
| 5 | 진도: "브라우저에 남김" | §4.5 — localStorage, 로그인 없음, 지우기 단추 |
| 6 | 디자인: "허브 결 + 시안 3개" | §4.7~4.8 — onsoonlabs 토큰을 바닥으로, 서로 다른 시안 3개를 실제 화면으로 만들어 Jiwon이 고른다 |
| 7 | 첫 덩어리: "Level 1만 새로 지어 배포" | §5 — 이 계획의 끝은 Level 1 배포. L3~L5 콘텐츠를 되살리는 "AI 지시문" 트랙은 §10의 다음 덩어리로만 적는다 |

**범위 밖(이 계획에서 하지 않는 것):** 서버 진도·계정·랭킹(#41), GFM·Obsidian·실시간 변환 편집기(#16), 문제은행 500 목표(#9)의 영어 배치 추가, Level 2·3 요소 13개 구현(옛 3레벨 체계 자체를 없앤다), 허브 방문 페이지 개편. 열린 이슈 #2·#9·#16·#41·#42는 닫지 않고 "2026-11 재설계 뒤 재평가" 코멘트만 단다(WS4).

## 2. 기존 확정 규칙 — 회귀 방지를 위해 다시 적는다

**그대로 지키는 것**

- 로그인·계정 없음. 런타임 AI 호출 없음. 채점은 결정론적이고 **마크다운 구조만** 본다(산문·대소문자·맞춤법·띄어쓰기 수는 채점하지 않는다 — 옛 결정 D9·D10). 판정은 두 가지뿐(통과 / 다시).
- 라이선스: 코드 AGPL-3.0-or-later, 문제은행 콘텐츠 CC BY-SA 4.0(새 한국어 콘텐츠도 같다), 글꼴 OFL. 제3자 로고·상표를 제품 이름·화면에 쓰지 않는다.
- Sentry는 DSN이 있는 빌드에서만, 지금의 필터(초안 본문·요청·사용자 객체 제외) 그대로. 학습자 메모(D1)는 90일 보존, IP 미저장.
- 키보드만으로 전 흐름이 된다. 모션을 끈 사용자에게는 모션을 끈다.
- onsoonlabs `intend.md`의 공통 규칙: 바탕은 흰색, 같은 것을 두 번 보여주지 않는다, 스크롤마다 바뀌는 움직임을 두지 않는다, 구간 이름표를 붙이지 않는다, 한국어 문장은 "~다"로 끝낸다(해요체 금지, 부탁은 서술문으로), 여백과 정렬은 좌표로 맞춘다, 단추는 모서리 8px 네모(알약은 언어 토글 하나뿐). 느낌의 레퍼런스는 Mintlify·Todoist.
- 전역 §8.1의 피할 패턴: 크림·오프화이트 배경, 헤드라인의 이탤릭 강조 단어, 01/02/03 번호 섹션 라벨, 모노스페이스 라벨(코드가 아닌 곳), 알약 단추.

**이 계획이 명시적으로 폐기하는 옛 결정**

| 옛 결정 | 폐기 이유 | 대체 |
|---|---|---|
| D12 책 펼침면(CBT desk)·페이지 넘김·종이 질감 | 허브 결과 정반대, Jiwon 취향과 어긋남 | 흰 바탕, 허브 토큰(§4.7) |
| D3 6문제(현재 5문제) 턴·진행 레일 | 턴이 끝나면 갈 곳이 없고 시간 비교가 목적이었음 | "오늘의 다섯 장"은 묶음일 뿐, 레일·점수 경쟁 없음 |
| 상시 타이머·"Level standing" 자리 | 압박 없는 학습 철학과 충돌(7/19 리뷰 P2-10) | 타이머 없음. 요약에 걸린 시간도 표시하지 않음 |
| 3레벨 체계와 Coming soon 잠금(#161) | 두 달 넘게 미완성 첫인상 | 레벨 없음. 기호 12개의 지도 하나 |
| 7/25 카드 드릴(상자에 기호 한 글자) | 문서를 쓰는 행동이 사라짐 | 에디터에 문서 한 장(§4.1) |
| D7의 "sessionStorage만" 조항 | 돌아올 이유가 없음. Jiwon 결정(2026-11-03) | localStorage 진도(§4.4). "계정 없음"은 유지 |
| 오답 1회에 정답 전체 공개 | 회상 연습이 되지 않음 | 2회 실패 뒤 공개(§4.1) |

**7/25 카드 전환 때 지적된 다섯 문제와 새 설계의 답** — 같은 함정에 다시 빠지지 않기 위한 표다.

| 7/25 지적 | 새 설계의 답 |
|---|---|
| Level 1~2 콘텐츠가 두 페이지를 채우지 못한다 | 문서 1장(3~10줄)을 목표+에디터 한 묶음으로 한 화면에. 두 "페이지"가 아니라 두 칸이고, 폭에 따라 좌우/상하 |
| 주의가 Goal·문서·카드·탭·Hint로 갈린다 | 화면 요소는 셋뿐: 목표(렌더), 에디터, 판정 바. 탭 없음 |
| 힌트가 입력면을 떠난다 | 힌트는 판정 바 자리에 한 줄로 뜨고 포커스는 에디터에 남는다 |
| 오답에 일반적인 교정만 나온다 | 기존 진단(matchDiagnostics·correctionCues)으로 "몇 번째 줄의 무엇"을 지목하고 그 줄을 에디터에서 표시한다 |
| 책 펼침면이 휴대폰에 맞지 않는다 | 상하 스택 + 하단 고정 판정 바. 390×844 첫 화면에 목표 첫 줄과 에디터 첫 줄이 함께 보여야 한다(게이트 G1) |

## 3. 현재 구조 — 탐색 근거

이 세션의 직접 읽기와 읽기 전용 코드 지도(main `e406c95`)를 합쳤다. 경로는 nabimd 저장소 기준이다. 설계는 이 절의 근거 위에서만 한다.

### 3.1 지금 렌더되는 경로와 죽은 코드

- 살아 있는 경로는 하나다: `App` → `EditorialDesk` → `CardFirstPractice` → `CenterCard`(`src/App.tsx:256-290`, `src/components/EditorialDesk.tsx:207-234`, `src/components/CardFirstPractice.tsx:147`). 랜딩은 `OpenBookLanding` + `WhyMarkdown`(`App.tsx:256,277`, `OpenBookLanding.tsx:52`), 상단 바 `ExerciseTopBar`, 판정 `VerdictNotice`, 요약 `RunSummary` + `SummaryFeedbackForm`, 렌더 `RenderedDocumentBody`.
- **죽은 코드(import 0건, 테스트만 실행):** CodeMirror 편집기 `MarkdownSourceEditor`(`src/components/MarkdownSourceEditor.tsx:140-195`, 편집 가능 export `:326-340`), `WordProcessorPage`, `WritingProcessor`, `GoalPanel`, `AnswerPanel`, `src/editor/*`(투명 문자 `invisibleCharacters.ts:72-79`, 빈 칸 안내 `markdownBlankGuides.ts:41-191`, `renderedMarkdown.ts`), `editorKeyboard.ts`. `scripts/verifyProductionBundle.mjs:27-30`에 "retired CodeMirror editor" 주석. **재설계가 되살릴 것이 바로 이 묶음이다** — 에디터 테스트 632줄이 그대로 돈다.
- 자동 진행 900ms `EditorialDesk.tsx:84-108`. 타이머 `src/session/learningSession.ts:193`, `src/components/ElapsedTime.tsx:31-53`. 점수 `EditorialDesk.tsx:43-48`. 페이지 넘김 오케스트레이션 `App.tsx:177-237,259-293`.

### 3.2 채점 엔진 — 재사용의 핵심

- React·세션에 의존하지 않는 순수 함수다. `evaluateProblem(problem, source) → Evaluation`(`src/engine/evaluateProblem.ts:7-19`), `evaluateMatch`는 priority 다음 선언 순으로 검사해 실패를 모은다(`evaluateMatch.ts:78-114`), `evaluateEditorial`은 리뷰 문구를 최대 3개(`evaluateEditorial.ts:39-47`), `createEvaluationContext`(`evaluationContext.ts:14-52`), `diagnoseMatchFailure`(`matchDiagnostics.ts:300-327`).
- 문제에서 읽는 필드는 셋뿐이다: `matchChecks`, `editorialChecks`, `target`(진단용).
- 출력: `fail {feedbackId, message, failures[{check, diagnostic}]}` 또는 `matched {reviewItems}`(`src/engine/types.ts:19-44`). 진단 `MatchDiagnostic`: classification(aggregate/specific), reason(extra/malformed/missing), location, expectedRange, observedRange(`types.ts:8-17`).
- 술어 전부: `heading-spacing`, `hash-heading-style`, `has-heading`(`predicates/heading.ts:29-41`); `block-count`, `inline-presence`, `heading-depth-order`, `list-shape`, `blockquote-shape`, `inline-code-shape`, `link-shape`, `code-block`, `block-sequence`, `document-limits`(`predicates/structural.ts:746-767`). 옵션 정의 `src/content/types.ts:83-165`, 범위 document/block/section(`types.ts:19-30`, `sectionIndex.ts:16-35`). **할 일 목록은 `list-shape`의 `requireTaskItems`(`types.ts:119`), 자동링크는 `allowAutolinks`(`types.ts:80`)로 이미 채점한다. 표는 `block-count`로 존재만 센다 — 머리 칸 수·본문 행 수 제약은 없다(§4.2에서 `table-shape`로 보강).** 옛 커리큘럼이 "미구현"이라 한 것은 카드 드릴의 칸 나누기 쪽이었다.
- 없는 것: 표 모양(칸 수·행 수) 술어, 취소선·각주 술어, 본문 텍스트 비교(의도된 설계). Setext 제목은 `hash-heading-style`·`has-heading`이 거부하고 테스트가 그 동작을 고정한다(`src/engine/evaluateProblem.test.ts`).
- 손볼 곳 네 가지: ① 엔진 안의 영어 문구 — 목록 공백 안내(`evaluateMatch.ts:36,43`), 위치 라벨 "Document"·"Document title"·`In “…”`(`matchDiagnostics.ts:124-131,146`) ② 표시 정책(리뷰 3개)이 엔진 안(`evaluateEditorial.ts:46`) ③ 진단이 학습자 문서와 target의 블록 수·순서가 같다고 전제해, 다르면 `observedRange`가 null(`matchDiagnostics.ts:246-270`) — 자유롭게 쓴 문서에서는 줄 위치가 자주 빈다 ④ 실패마다 target 재파싱(`:306`).

### 3.3 문제 스키마와 데이터

- 필드(`src/content/types.ts:199-259`): `id`, `teachingMode`, `teaching{concept,howTo,example}`, `syntaxTokens`, `title`, `prompt`, `target`, `starterText`, `protectedContent`, `matchChecks`, `editorialChecks`, `hints[3]`, `reviewTags`, `convention?`; v2 전용 `familyId`, `skillIds`, `difficulty`, `retryFamily`, `schemaVersion: 2`, `level 1–5`, `flavor`, `vocabulary`, `sourceBatchId`, `revision`, `curriculumVersion`, `contentVariant`(`types.ts:240-253`). `GradableProblem` = v1 `Problem` | v2 `NormalizedProblem`(`types.ts:259`).
- **지금 화면이 한 번도 쓰지 않는 필드: `prompt`, `teaching`, `hints`, editorial `review`.** 화면 문구는 거의 전부 코드가 target에서 만든다(`src/guided/checkpointInstruction.ts:103-`, `guidedSyntax.ts:298-346`, `CenterCard.tsx:84-173`). 새 설계는 이 데이터 필드를 쓴다.
- `starterText`는 로드 때 `derivePlaintextStarter(target)`로 채운다(`src/content/problemBank.ts:35-42`, `src/content/plaintextStarter.ts:187`). 지워진 기호 자리를 계산하는 `deriveMarkdownBlankGuides`(`plaintextStarter.ts:284`)는 호출처가 없다 — 힌트 2단계 재료.
- 데이터 원천: `curriculum/problem-bank/runtime-projections.generated.json` 1.46 MB를 **정적 import**(`problemBank.ts:1`)하고 로드 시 동기로 필터·파생·가용성 계산을 한다(`problemBank.ts:13-51`, `entryChoices.ts:35-38,85-113`). 레코드 396 → 예산 필터 364 → 실제 출제 275(단일 236·혼합 39)(`entryAvailability.test.ts:9-11`, `problemBank.test.ts:59-78`, `entryChoices.test.ts:186,194`).
- 예산 정책 `runtimeBudget.ts:8-13` "never document-length typing", 비어 있지 않은 줄 12 이하(`:26,50-58`). 새 설계의 3~10줄은 이 안에 든다. 정책 문구는 재검토 대상.
- 데이터의 `level`과 런타임 레벨은 다르다 — 런타임 소속은 문법 요소로 정한다(`curriculumElements.ts:124-138`).
- 예시 둘. `l1-heading-apple`(`runtime-projections.generated.json:2813-2876`): target `# Apple`, matchChecks heading-spacing(p10)·hash-heading-style(p20)·has-heading(p30), editorial single-h1, hints 3줄. `l4-decision-printer-queue`(`:34666-34800`): block-sequence exact [h1, p, h2, blockquote, h2, list], blockquote-shape(section h2 #0), list-shape ordered 3..3(section h2 #1).

### 3.4 세션·진도

- 저장소와 키: sessionStorage `nabimd.progress.v5` + 메모리 폴백(`src/progress/progressStore.ts:22,781-787`, `browserStorage.ts:71-80`); `nabimd.session-seed.v1`(`useLearningSession.ts:45,51-76`); localStorage `nabimd.sound-muted`(`src/sound/feedbackSound.ts:11,25,59`); history.state 표식 `nabimd-practice-v3`(`App.tsx:30,138-175`).
- 7단 마이그레이션 사슬과 엄격 검증(`progressStore.ts:327-561,724-736`). 턴 5문제(`src/selection/runPolicy.ts:2-4`), 단일 4 + 혼합 1(`runComposition.ts:311-332`), 실패 시 수리 문제 삽입(`useLearningSession.ts:394-410`, `runSchedule.ts:8-20`). `useLearningSession`이 내놓는 액션 14개(`useLearningSession.ts:426-450`).
- 한국어 입력 처리의 흔적: ₩ 키를 백틱으로(`CenterCard.tsx:222-229`), IME 조합 중 Enter 무시(`CenterCard.tsx:254`, `EditorialDesk.tsx:137`) — 새 에디터로 옮긴다.

### 3.5 렌더링

- `RenderedDocumentBody` = react-markdown + remark-gfm(`singleTilde:false`)(`src/components/RenderedDocument.tsx:61-160`, `src/markdown/parser.ts:22`). 링크는 눌리지 않는 span, 이미지는 `[Image: alt]` 자리표시(`:67-79`). rehype·raw HTML 없음.
- 파서 하나(`parser.ts:6-31`)를 채점·칸 나누기·starter 파생이 공유한다.

### 3.6 서버·배포·CI

- `worker/index.ts`: POST `/nabimd/api/feedback`(`:104-194`; 405/415/403/레이트 리밋/413/400 순 검사, submissionId 중복 제거 `:157-191`), `/nabimd` → 308(`:199-202`), 밖은 404(`:204-206`), `/nabimd/*` 정적 자산 + `X-Nabi-Build-Sha`(`:208-247`), cron 만료 삭제(`:250-260`). 레이트 리밋 IP당 60초 3회(`:123-135`, `wrangler.jsonc:37-46`). R2 바인딩은 미사용. base 경로가 worker(`:1`)와 vite(`vite.config.ts:13`)에 따로 있다.
- CI `ci.yml`: PR과 main push에 `npm ci` → `npm run check` → `npm run test:e2e`(`:17-42`). **배포 단계는 없다.** 배포는 수동 `deploy:cloudflare`(`package.json:22`: 빌드 → D1 마이그레이션 → 배포 → 라이브 SHA 검증). `production-health.yml`: 매시 17분 + `workflow_dispatch(expected_sha)`(`:3-12`), 라이브의 `data-build-sha`로 그 리비전을 받아 `test:e2e:production`을 최대 3회(`:45-122`).
- `npm run check` 10단계(`package.json:115`): typecheck, 고지 검사, `bank:generate:check`, `bank:batch:test`, 배치 26개 + 예산 + provenance, repository gate, vitest, `bank:gate`, build, `bundle:verify`. 앱 빌드 자체는 배치 게이트를 부르지 않는다(JSON 하나만 import).
- 테스트: vitest 90(src) + 5(scripts), 게이트 설정 31개(`vitest.gate.config.ts:6-38`), e2e 4 스펙 — `capture-center-card-qa`(3), `feedback-sound`(1), `heading-flow`(32), `production-health`(2)(`playwright.config.ts:3-33`).

### 3.7 문자열·스타일·소리·의존성

- i18n 없음. 영어가 컴포넌트에 하드코딩(`CenterCard.tsx:297-488`, `VerdictNotice.tsx:94-147`, `RunSummary.tsx:181-227`, `OpenBookLanding.tsx:44-98`, `WhyMarkdown.tsx:6-34`, `ErrorBoundary.tsx:102-157`). `html lang="en"`(`index.html:2`). 소스에 한글 문자열 0건.
- `tokens.css:41-73`의 모션 값이 `src/motionTiming.ts:1-4`에 중복. `global.css` 4,652줄 중 죽은 구획 약 1,000줄(`1118-1634`, `2377-2712`, `3426-3528`). 책 메타포 CSS 171줄 + 넘김 keyframes 10종(`:483-651`, `:801`), 펼침면·종이 질감 배경 이미지(`:104`, `:1639-1641`).
- 소리: `feedbackSound.ts` 큐 3개(`public/audio/*.mp3`, 첫 제스처 때 잠금 해제 `:73-112`), `pageTurnSound.ts`(책 넘김 — 제거 대상). `src/sound/*.wav` 4개 미사용. 쓰이지 않는 이미지 3개(nabi-bookmark, nabi-summary-sprig, nabi-writing-rule).
- 의존성(`package.json:118-132`): `@codemirror/*` 4개(죽은 에디터만), `@sentry/browser`(동적 import, DSN 있을 때만), `lucide-react`, `mdast-util-*`(파서), `react`·`react-dom`, `react-markdown`·`remark-gfm`.

### 3.8 지도의 결론 — 쓸 것과 버릴 것

- **재사용:** `src/engine/*` + `src/markdown/parser.ts`; `src/feedback/reviewCorrections.ts`·`correctionCues.ts`(실패 → 라벨·위치·발췌); `MarkdownSourceEditor`(CodeMirror 6) + `invisibleCharacters` + `markdownBlankGuides` + `keyboardShortcut` + `RenderedDocumentBody`; 데이터의 `prompt`·`teaching`·`hints`; worker·D1·cron; `browserStorage`의 폴백 패턴.
- **삭제:** `src/guided/*`(1,599줄 `guidedSyntax.ts` 포함), `CenterCard`, `CardFirstPractice`, `mixedExercisePolicy`, 옛 UI(`GoalPanel`·`AnswerPanel`·`WordProcessorPage`·`WritingProcessor` — 에디터만 떼어 내고), `src/ranking`, 턴 기계(`runComposition`·`runSchedule`·`selectTransferProblem`), `progressStore`의 7단 마이그레이션, App의 history 스냅샷, 페이지 넘김 오버레이·소리, 죽은 CSS, `.wav`, 이미지 3개.
- **이번에 건드리지 않음(후속 과제):** `scripts/problem-bank`의 배치 게이트 30개와 `src/content/batches`(봉인된 영어 데이터 — 지우면 `check`와 게이트 설정을 함께 고쳐야 해서 범위 밖), worker와 vite의 base 경로 중복, R2 바인딩, `VerdictNotice.tsx:118-121`의 없는 탭을 가리키는 문구.

## 4. 설계

### 4.1 한 판의 모양

연습의 단위는 **"장"** — 렌더된 짧은 문서 한 장을 보고 그 마크다운을 쓴다. 화면은 셋이다: 홈(기호 지도), 연습, 요약.

**홈 = 기호 지도**

- 머리말: 나비 로고 + "Nabi Markdown"(Pretendard 700). 오른쪽에 언어 토글(한국어/English), 소리 토글, 설정(진도 지우기).
- 소개는 한 문장: "실제 문서를 마크다운으로 직접 써 보는 연습이다. 로그인 없이 바로 시작한다." 그 아래 주 단추 **"오늘의 다섯 장 시작"**.
- 지도: 기호 12칸 격자(휴대폰 2열, 데스크톱 4열). 칸마다 기호 이름(제목·굵게·기울임·목록·번호 목록·링크·코드·코드 블록·인용·이미지·표·할 일 목록), 기호 예시(`# `, `**`, …, D2Coding), 상태 점(안 해봄 / 해봄 / 익숙함 = 통과 3회 이상). 칸을 누르면 그 기호가 든 문서로 바로 연습이 시작된다.
- 바닥글: 소스 코드 · 제3자 라이선스 · 개인정보와 쿠키 설정 · 버전. 한 번만 나온다.

**연습**

- 상단 얇은 줄: 홈으로, "오늘의 다섯 장 2/5"(묶음일 때만), 다른 장(같은 기호의 다른 문서), 언어·소리.
- 지시 한 줄: "이 문서를 마크다운으로 쓴다. 이번 기호: **인용**." 기호 이름 아래 가르침 한 줄("`>` 와 공백으로 시작하는 줄은 인용이 된다")은 그 기호가 **안 해봄**일 때만 보이고 익숙함이 되면 사라진다(발판 거두기).
- 목표 칸: 렌더된 문서(3~10줄). 제목은 "목표".
- 에디터 칸: CodeMirror. 초기값은 목표의 산문(기호만 뺀 것, 줄 구조 유지) — **채우기** 모드가 기본이고 "빈 종이에서 쓰기" 토글이 있다(선택은 기억). 마크다운 기호 하이라이트, 투명 문자 보기 토글(기존), 줄 번호 없음, Tab은 두 칸 들여쓰기(Esc 다음 Tab은 포커스 이동), 글꼴 D2Coding. 한국어 자판에서 ₩로 들어오는 키는 백틱으로 바꾼다(기존 처리 재사용). 에디터 본체는 지금 연결이 끊긴 기존 CodeMirror 컴포넌트(§3.1)를 되살려 쓴다.
- 판정 바(에디터 아래, 휴대폰에서는 화면 아래 고정): 왼쪽 "힌트", 가운데 상태 문구, 오른쪽 **"확인 ⌘↩"**(Windows는 Ctrl↩, 라벨은 OS에 맞춤).
  - 통과: 바가 leaf-soft 바탕(먹색 글자)으로 바뀌고 "통과 — 인용 기호를 바르게 썼다." 목표 옆에 **내가 쓴 것의 렌더**가 나란히 나타나 비교할 수 있고, 단추는 "다음 장 ↩"이 된다. **자동 진행은 없다** — 결과를 보는 시간이 학습이다.
  - 다시: 상태 문구 한 문장("2번째 줄: 목록 기호 뒤에 공백이 필요하다.")이 글자용 clay(§4.7)로 뜨고 해당 줄에 옅은 밑줄이 그어진다. 입력은 그대로 둔다(제자리 수정). 진단이 줄 위치를 못 찾으면(§3.2의 observedRange가 빈 경우) 줄 표시 없이 문장만 보여준다. 같은 장에서 2회째 실패하면 "정답 보기"가 생기고, 누르면 정답 소스가 목표 칸 아래에 펼쳐진다(에디터는 유지).
  - 힌트: 1단계 기호만("`>` 와 공백"), 2단계 지워진 기호 자리를 에디터 안에 빈 칸으로 표시(기존 `markdownBlankGuides` 재사용, §3.3) + 데이터의 예시 힌트 한 줄. 벌점 없음, 지도 상태에 영향 없음, 포커스는 에디터에 남는다. 지시·가르침·힌트 문구는 문제 데이터의 `prompt`·`teaching`·`hints`에서 온다 — 지금 화면이 한 번도 쓰지 않던 필드다(§3.3).
- 소리: 기존 3종(통과·다시·요약)과 토글을 유지하고 기본값은 지금과 같게 둔다.

**요약(다섯 장을 끝냈을 때)**

- "다섯 장을 썼다." + 지도의 변화(새로 해본 기호, 익숙해진 기호) + 다섯 장의 소스/렌더 카드 + 주 단추 **"다섯 장 더"** + "홈". 메모 남기기(기존 D1 폼, 한국어 문구)는 접힌 상태로 아래에.
- 점수표·걸린 시간은 없다. "한 번에 통과 4장" 같은 격려 한 줄은 허용한다(남과 비교하지 않는다).

**없는 것**: 타이머, 레벨, 잠금, 랭킹 자리, 페이지 넘김, 종이 질감, 자동 진행, "Example"이라는 더미 예시, 타자기 효과.

### 4.2 기호 12개와 채점

| 기호 | 마크 | 엔진이 보는 것(구조) | 동치로 통과 |
|---|---|---|---|
| 제목 | `# `, `## ` | 깊이와 순서 | Setext(`===`)는 **통과하지 않는다** — 엔진이 거부하고(`predicates/heading.ts`) 전용 안내 문구로 해시 방식을 가르친다(D11 유지) |
| 굵게 | `**` | strong 노드 | `__` |
| 기울임 | `*` | emphasis 노드 | `_` |
| 목록 | `- ` | 항목 수, 중첩 | `*`, `+` |
| 번호 목록 | `1. ` | 항목 수, 순서 있음 | `1)` |
| 링크 | `[글](주소)` | link 노드와 글 | 주소는 아무 URL |
| 코드 | `` ` `` | inlineCode | — |
| 코드 블록 | ```` ``` ```` | code 노드 | `~~~`, 언어 태그 유무 |
| 인용 | `> ` | blockquote | — |
| 이미지 | `![설명](주소)` | image 노드와 alt | 주소는 아무 URL |
| 표 | `\| a \| b \|` + 구분선 | 표의 존재 + 머리 칸 수·본문 행 수(새 술어 `table-shape`, WS3이 추가) | 정렬 콜론 유무 |
| 할 일 목록 | `- [ ] ` | 작업 항목 | `[x]` 대소문자 |

11개는 엔진이 이미 채점한다(§3.2). 할 일 목록은 `list-shape`의 `requireTaskItems` 옵션이고, 옛 커리큘럼이 "미구현"이라 한 것은 카드 드릴의 칸 나누기 쪽이었다. **표만 예외다**: 지금 엔진은 `block-count`로 표의 존재만 세고 머리 칸 수·본문 행 수를 볼 수 없다(`predicates/structural.ts`의 `blockCountPasses`). 본문 행이 빠진 표가 통과하면 안 되므로 WS3이 `table-shape` 술어(머리 칸 수, 본문 행 수 min/max, 범위 옵션)와 부정 픽스처를 `src/engine/predicates/structural.ts`·`src/content/types.ts`에 추가한다 — 콘텐츠가 필요로 하는 술어라 콘텐츠 소유자가 든다. 그 밖의 술어는 새로 만들지 않는다. 엔진 안의 영어 문구와 리뷰 3개 제한(§3.2의 손볼 곳 ①②)은 WS2가 사전으로 옮긴다(파일이 다르다: `evaluateMatch.ts`·`matchDiagnostics.ts`·`evaluateEditorial.ts`).

### 4.3 콘텐츠 — 한국어 문제은행 v1

- 수량: 기호당 8장 × 12 = 96장(단일 기호) + 혼합(기호 2~3개) 24장 = **120장**. 최소 게이트는 기호당 8장.
- 문서 유형 10: 장보기 메모, 할 일, 회의 메모, 공지, 레시피, 독서 메모, 여행 계획, 버그 신고, README 조각, **AI에게 보내는 요청문**(목표·조건·원하는 결과를 제목과 목록으로 나눈 짧은 글 — Jiwon의 원래 문장 "Markdown is the first code you write with AI"를 Level 1에서부터 보여주는 자리다). 유형마다 최소 한 기호에 등장한다.
- 길이: 3~10줄, 한 줄 60자 이하, 한 장 150자 이하. 고유명사는 가상, 실존 URL·전화·주소 없음(링크·이미지 주소는 `https://example.com/…`), 민감한 내용 없음. 라이선스는 CC BY-SA 4.0 그대로.
- 형식: 기존 문제 스키마(§3에서 필드 확정) 그대로 쓴다. 파일은 `src/content/ko/<기호>.ts` 12개 + `src/content/ko/mixed.ts`. 언어 구분 필드(`locale: "ko" | "en"`)가 스키마에 없으면 추가한다(`flavor`와 별개).
- 검증은 옛 봉인 공정(배치 digest·리뷰어 2명·provenance)을 쓰지 않는다. 대신: `validateProblemBank` + **실엔진 픽스처 테스트**(장마다 최소 4개 — 정답, 산문만 바꾼 변형, 기호 누락, 기호 오형) + 동형 중복(target 동일) 0 + 한국어 lint(해요체 0건, 줄 길이). 이 넷이 CI에서 돈다.
- 생성: 모델이 초안을 쓰고 픽스처가 1차 심판을 본다. 표본 20장은 Jiwon이 눈으로 검수한다(멈춤 조건). 이 계획은 작성 모델명을 문서에 박지 않는다(#245의 GPT-6 Astra 문구는 별개 결정으로 남긴다).
- 영어: 새로 만들지 않는다. 기존 Level 1 164장과 Level 1 기호만으로 된 혼합 문서(#161의 80장)를 영어 모드가 그대로 쓴다. 옛 Level 2~5 콘텐츠는 데이터로 남기고 서빙하지 않는다.

### 4.4 언어

- 문자열 사전 `src/i18n/ko.ts`·`src/i18n/en.ts`(허브 `site/views.js`의 STR처럼 키 하나에 두 언어). 컴포넌트 안에 사용자 문구를 직접 쓰지 않는다(게이트: grep 0건).
- 기본 언어: localStorage `onsoon-lang`(허브가 쓰는 키)을 읽고, 없으면 `navigator.language`로 ko/en. 토글로 바꾸면 같은 키에 저장한다 — onsoonlabs.com 한 사이트에 언어 선택 하나다(`site/shared/site.js:19-20`과 같은 규칙).
- `<html lang>`, `<title>`, meta description, OG 문구도 언어를 따른다.
- 문체: 한국어는 "~다". 영어 문구는 새 화면에 맞게 다시 쓰되 어조는 지금 것을 잇는다.
- 판정 문구의 두 원천: 문제 데이터의 `matchChecks[].feedback`(언어별로 데이터에 든다)과 코드가 만드는 위치 라벨·목록 공백 안내(§3.2). 후자는 엔진 밖 사전으로 옮기고 엔진은 키만 돌려준다.

### 4.5 진도 저장

- localStorage `nabimd.learning.v1`: `{ v: 1, ko: { 기호별 { tries, passes, lastAt }, recentIds }, en: {…} }`. 이름을 새로 짓는 이유는 옛 진도 키가 이미 `nabimd.progress.v5`(sessionStorage, §3.4)까지 올라가 있어서다. 옛 키는 읽지 않고 지운다. 초안은 지금처럼 sessionStorage(문서가 짧아 잃어도 비용이 작다).
- 저장이 막힌 환경(사파리 시크릿 등)은 메모리 폴백(기존 `browserStorage` 방식 재사용).
- 설정의 "진도 지우기"(확인 한 번). 지도는 즉시 비워진다.
- 고지: SECURITY.md의 Scope와 앱 안 개인정보 안내에 표로 적는다 — 브라우저에 남기는 것: 언어(`onsoon-lang`), 진도(`nabimd.learning.v1`), 통계 동의(`nabimd.consent.v1`), 소리 설정(`nabimd.sound-muted`, 기존).

### 4.6 계측

- Cloudflare Web Analytics. 토큰은 허브와 같은 것(`site/consent.js:12`, 같은 도메인이라 같은 대시보드에서 경로로 갈라 본다). **동의한 뒤에만** beacon을 부른다. 동의 전에는 허브처럼 `window.__cfBeacon = { load: 'single' }`을 먼저 둬서 자동 삽입이 켜져 있어도 집계되지 않게 한다.
- 동의 키는 nabimd 자체 `nabimd.consent.v1`. 허브의 `/privacy/`가 nabimd를 범위 밖이라고 적어 두어서(`site/views.js`의 pvScope), 허브의 `onsoon-consent`를 공유하면 고지와 어긋난다.
- 배너는 허브 `consent.js`의 문구 체계(필수만 허용 / 모두 동의 / 항목 고르기)를 React 컴포넌트로 옮긴다. 바닥글 "쿠키 설정"으로 다시 연다.
- 단계를 세기 위해 SPA지만 주소를 바꾼다: `/nabimd/`(홈) → `/nabimd/practice`(연습) → `/nabimd/done`(요약). beacon의 SPA 추적 옵션 유무는 WS2에서 확인한다(§7 가정).
- 출시 4주 뒤 읽을 숫자: 방문, `/practice` 도달 비율, `/done` 도달 비율, 국가, 유입 경로. 목표치는 두지 않는다 — 유입 경로가 없는 상태의 기준선이다.

### 4.7 디자인 바닥 — 허브 결

nabimd의 `src/styles/tokens.css`를 아래 값으로 **통째로 교체**하고, `global.css`(4,652줄)는 재사용하지 않고 새로 쓴다. 옮겨 적을 만한 조각(빠뜨린 줄의 옅은 밑줄 표시, 코드 블록 렌더 스타일, 투명 문자 표시)만 가져온다.

| 항목 | 값 (onsoonlabs `site/shared/tokens.css`) |
|---|---|
| 바탕·글·선 | `--bg #ffffff` · `--ink #1f1e1c` · `--ink-soft #6b655e` · `--line #e7e2da` · `--card #ffffff` |
| 액센트 3색 | clay `#df5a48` · butter `#eec25f` · leaf `#7d9e6a`; soft 톤은 같은 hue. nabimd가 더하는 것은 글자용 짙은 변형 `--acc-clay-text`·`--acc-leaf-text` 둘뿐(4.5:1 이상, WS1 측정) |
| 글자 크기 | 13 / 15 / 17.5 / 21 / 26px + display `clamp(1.9rem, 4.6vw, 3.1rem)`(제품 페이지 급) |
| 굵기·행간 | 400 본문 · 500 라벨 · 700 제목 · 800 display 한 곳 / 1.15 · 1.3 · 1.65 |
| 여백·모서리 | 8의 배수(8~144) / 8px · 16px (알약은 언어 토글만) |
| 모션 | `.22s` 상태 전환 · `.14s` 눌림 · `.5s` 연출 한 번 · `cubic-bezier(.2,.8,.2,1)` |
| 다크 모드 | 허브의 `prefers-color-scheme: dark` 세트 그대로(`#1a1a1c` 바탕 등). 에디터 테마도 두 벌 |

- 색의 쓰임과 대비: 허브의 원색은 흰 바탕에서 글자용으로 쓰기엔 대비가 모자란다(clay `#df5a48` 약 3.7:1, leaf `#7d9e6a` 약 3.0:1 — 둘 다 4.5:1 미달). 그래서 **글자에는 같은 hue의 짙은 변형**을 쓴다: 링크·"다시" 문구 = `--acc-clay-text`(clay hue, 흰 바탕에서 4.5:1 이상이 되도록 WS1이 측정해 값을 정하고 비교표에 측정값을 적는다), 통과 문구 = `--acc-leaf-text`(같은 방식). **주 단추는 먹색(`--ink`) 바탕에 흰 글자**다 — 허브 주 단추의 hover 상태이자 지금 nabimd의 Enter 단추 색이라 한 식구로 보이고 대비는 21:1이다. 통과 띠는 `--acc-leaf-soft` 바탕에 `--ink` 글자, clay 원색은 밑줄·아이콘·강조 띠처럼 글자가 아닌 곳에만. 선 = line, 보조 글 = ink-soft. 제품 고유 색을 더하지 않는다(허브 규칙 "제품별 액센트 색은 두지 않는다") — 짙은 변형은 새 hue가 아니라 같은 hue의 명도 단계다.
- 글꼴: 화면 = **Pretendard Variable**(OFL 1.1; 허브의 `PretendardVariable.subset.woff2`가 한글 2,350자를 담는지 WS1 첫 단계에서 확인하고, 부족하면 공식 배포본의 한글 subset을 자체 호스팅). 에디터·코드·기호 예시 = **D2Coding**(OFL 1.1, Ver 1.4.0, 한글 고정폭). Source Serif 4·JetBrains Mono는 제거하고 THIRD-PARTY-NOTICES와 라이선스 페이지를 재생성한다.
- 워드마크: 나비 로고(유지) + "Nabi Markdown" 글자(Pretendard 700). 세리프 워드마크 이미지는 교체.
- 모션: 상태 전환 한 종류와 통과 때 지도 칸이 채워지는 연출 한 번. 페이지 넘김·타자기·스크롤 연동 없음. `prefers-reduced-motion`이면 전부 끈다.
- 아이콘: lucide-react 유지, 최소로.
- 피할 패턴(전역 §8.1): 크림 배경, 이탤릭 강조 헤드라인, 01/02/03 번호 라벨, 코드가 아닌 곳의 모노스페이스 라벨, 알약 단추.

### 4.8 시안 3개 — 실제 화면으로 만들어 고른다

공통: §4.7 토큰, 같은 문서(장보기 메모: 제목 1 + 목록 3), 같은 세 상태(처음 / 다시 / 통과), 두 폭(1280×800, 390×844). 세 시안은 **배치**가 다르고 색·글꼴은 같다.

| 시안 | 배치 | 휴대폰 | 본(Mobbin) |
|---|---|---|---|
| **A 목표 옆에 쓰기** | 왼쪽 목표(렌더), 오른쪽 에디터. 판정 바는 에디터 아래 오른쪽 정렬. 통과하면 오른쪽이 "내가 쓴 것" 렌더와 소스로 나뉜다 | 목표 → 에디터 → 아래 고정 판정 바 | Reddit의 마크다운 편집기 + 오른쪽 미리보기 — https://mobbin.com/screens/1f1c5529-964a-4d83-83e2-20ae0312f376 |
| **B 한 줄 집중** | 한 열. 위에 지시와 목표 카드, 그 아래 에디터, 화면 아래 고정 판정 바(건너뛰기 · 힌트 · 확인). 통과하면 목표 카드가 비교 카드로 바뀐다 | 데스크톱과 같은 한 열 | Duolingo 'Write this in Korean' — https://mobbin.com/screens/9fb54ed6-d4c9-465e-9f54-37d24bc8bcae |
| **C 편집기** | 세 칸 — 왼쪽 지시·목표, 가운데 에디터, 오른쪽 **실시간 미리보기**(이 시안만). 판정 바는 가운데 칸 아래 | 미리보기는 탭으로 접고 상하 스택 | Codecademy 레슨 화면 — https://mobbin.com/screens/4c659faf-b487-4db2-9807-fc470afd7e09 |

시안 C는 "판정 전에는 미리보기를 보여주지 않는다"는 회상 원칙과 부딪힌다. 그래서 넣는다 — Jiwon이 실시간 미리보기의 편안함과 회상 연습의 긴장 중 무엇을 택할지는 화면을 보고 정할 일이다.

- 선택 기준(Jiwon이 볼 것): 첫 시선이 목표에서 에디터로 자연스럽게 가는가 / 390폭 첫 화면에 목표 첫 줄과 에디터 첫 줄이 함께 보이는가 / "다시" 문구가 눈에 띄되 시끄럽지 않은가 / 허브 제품 페이지 옆에 놓아도 한 식구로 보이는가.
- 구현 방식: 앱 안에 `?variant=a|b|c` 임시 분기(고른 뒤 나머지 삭제). Playwright로 3 시안 × 2 폭 × 3 상태 = 18장을 `docs/design/2026-11-redesign/variants/`에 캡처하고 비교표 `README.md`를 쓴다. 허브 제품 페이지 캡처 한 장을 옆에 놓은 비교 이미지도 만든다.
- 시안 세션이 묻지 않고 정해도 되는 것: 칸의 비율, 판정 바의 높이, 아이콘 유무, 카드 그림자 유무(허브 `--shadow` 안에서), 지도 칸의 모양.

## 5. 워크스트림과 순서

| WS | 내용 | 산출물 | 게이트 |
|---|---|---|---|
| **WS0 승인·등록** | Jiwon이 이 계획을 승인하면 이 세션이 `github-issue` 규율로 이슈를 만든다: 우산 이슈 1개(이 문서 링크, WS 체크리스트, "main 배포 금지 구간" 안내) + WS1~WS4 이슈 4개(본문 = 부록의 실행 프롬프트). 열린 옛 이슈 5개에 재평가 코멘트 | 이슈 5개 | Jiwon 승인 |
| **WS1 시안** | 토큰 이식 → 시안 A·B·C 구현 → 18장 캡처 + 비교표 → Jiwon 선택 | PR 1개(토큰·시안·캡처), 비교표 | G1 + Jiwon 선택 |
| **WS2 앱 뼈대** | 라우팅(홈·연습·요약), i18n 사전, 진도 저장, 에디터(CodeMirror 재사용), 판정·힌트·정답 보기, 요약, 동의+계측, 다크 모드, 엔진 영어 문구의 사전화, 옛 화면·책 CSS·레벨·타이머·턴·랭킹 코드 삭제(배치 게이트와 봉인 데이터는 건드리지 않음, §3.8) | PR 3~5개 | G2 |
| **WS3 한국어 콘텐츠** | 120장 작성 + 픽스처 + validate + lint. 표 모양 술어 `table-shape` 추가(§4.2). 영어 Level 1 서빙 확인 | PR 2~3개(기호 묶음별) | G3 |
| **WS4 통합·출시 준비** | e2e 전면 갱신(production-health runbook 포함), a11y·번들·Lighthouse, 라이선스 페이지, README·SECURITY·CONTRIBUTING·changelog 갱신, OG 이미지, 배포 리허설(`wrangler deploy --dry-run`) → **Jiwon 배포 승인** → 배포 → production-health workflow_dispatch → 허브 `products.json` 문구·캡처 PR(onsoonlabs 저장소, Jiwon 머지) | PR 2개 + 배포 | G4 |

**순서의 이유.** 시안이 앱 뼈대의 배치를 정하므로 WS1이 먼저다. WS3은 스키마가 고정되어 있어 화면과 독립이라 WS2와 **병렬**로 돈다(파일 소유권: WS2 = `src/components`·`src/styles`·`src/i18n`·`src/progress`·`src/app`·`src/engine`의 `evaluateMatch.ts`·`matchDiagnostics.ts`·`evaluateEditorial.ts`(문구 키 분리), WS3 = `src/content/ko`·`scripts/content`·`src/engine/predicates/structural.ts`의 `table-shape` 술어와 `src/content/types.ts`의 그 옵션·그 테스트). WS4는 둘이 끝나야 한다.

**브랜치와 배포.** PR은 main으로 직행한다. `ci.yml`은 push와 PR에 검사만 하고 배포는 `npm run deploy:cloudflare`를 사람이 실행하므로, main이 미완성이어도 라이브는 바뀌지 않는다. 다만 옛 화면을 지우는 PR이 머지되는 순간부터 WS4가 끝날 때까지 main은 **배포 금지 구간**이다 — 우산 이슈 맨 위에 적고, WS4 외의 세션은 `deploy:cloudflare`를 실행하지 않는다. 긴 브랜치에 모았다가 한 번에 머지하는 대안은 PR마다 붙는 Codex 리뷰를 얇게 만들어서 쓰지 않는다.

**이 계획이 미리 정한 기본값(구현자가 다시 묻지 않는다).** 자동 진행 없음 · 2회 실패 뒤 정답 보기 · 힌트 2단계 · "오늘의 다섯 장"은 안 해본 기호 우선, 이웃한 장은 같은 기호 금지 · 채우기 모드 기본 · 익숙함 = 통과 3회 · 판정 문구는 한 문장 · 언어 선택은 `onsoon-lang` 공유 · 소리 기본값 유지. Jiwon이 이 중 바꾸고 싶은 것은 승인 때 말하면 된다.

## 6. 게이트와 폐기 기준 — 숫자로

**G1 시안(WS1)**
- 캡처 18장(3 시안 × 2 폭 × 3 상태)이 `docs/design/2026-11-redesign/variants/`에 있고 비교표가 각 장을 가리킨다.
- 세 시안 모두 390폭에서 가로 스크롤 0, 390×844 첫 화면에 목표 첫 줄과 에디터 첫 줄이 함께 보인다(Playwright bbox로 측정).
- 글자 대비 4.5:1 이상 — 본문·링크·판정 문구·단추 라벨 모두(axe 자동 검사 + 토큰별 측정값을 비교표에), 콘솔 오류 0.
- Jiwon이 하나를 고른다(사람 게이트). **셋 다 거부하면 시안을 더 만들지 않고 멈춰 이유를 묻는다.** 두 번째 라운드는 Jiwon의 지시로만.

**G2 앱(WS2)**
- `npm run typecheck` 오류 0, 단위 테스트 전부 녹색(지운 화면의 테스트는 함께 지운다).
- e2e 8 시나리오 녹색: ① 첫 방문 → 홈 지도 ② 칸 선택 → 작성 → 다시 → 수정 → 통과 ③ 오늘의 다섯 장 완주 → 요약 ④ 새로고침 뒤 지도 유지 ⑤ 진도 지우기 ⑥ 언어 전환 ko↔en(사전 누락 0) ⑦ 동의 전 beacon 요청 0건, 동의 후 1건 ⑧ 키보드만으로 ②를 완주.
- axe critical 0. 초기 JS 800 KB(raw) 이하이고 문제은행은 언어별 지연 청크. Lighthouse 모바일 성능 85 이상, 접근성 95 이상.
- 한국어 문자열 lint: 해요체 0건(`요.`·`요?`·`요!`로 끝나는 문장), 컴포넌트 안 하드코딩 문구 0건.
- 영어 모드에서 기존 Level 1 164장 중 무작위 20장이 새 화면에서 채우기 모드로 열리고 정답 소스가 통과한다.

**G3 콘텐츠(WS3)**
- 한국어 96장 이상(기호당 8장 이상), 장마다 픽스처 4개 이상이 실엔진을 통과, target 중복 0, 줄 60자 이하, 금칙(실존 URL·전화·주소·실명) 0.
- `table-shape` 술어가 단위 테스트와 함께 들어 있고, 표 문제의 픽스처에 본문 행이 빠진 표와 머리 칸 수가 다른 표가 실패하는 부정 픽스처가 있다.
- 생성 초안의 픽스처 첫 통과율을 기록한다. **70% 미만이면 수량을 줄이지 말고 생성 지침을 고쳐 다시 돌린다. 두 번째도 미만이면 멈추고 보고한다.**
- 표본 20장 Jiwon 눈검수 통과(사람 게이트).

**G4 출시(WS4)**
- `npm run check` 녹색, `wrangler deploy --dry-run` 성공, 라이선스 페이지에 Pretendard·D2Coding이 있고 Source Serif 4·JetBrains Mono가 없다.
- Jiwon 배포 승인 → 배포 → `production-health` workflow_dispatch 녹색 → 라이브에서 ko·en 각각 한 판 완주.
- 배포 24시간 뒤 Sentry 신규 오류 0, 콘솔 오류 0.
- 실기기(사람): iPhone Safari 한국어 자판에서 CodeMirror 한글 조합 입력과 ⌘↩, Android Chrome 같은 항목, 효과음(iOS 무음 스위치).

**폐기·보류 기준.** G1에서 셋 다 거부 → 멈춤. G3에서 두 번째 재시도도 70% 미만 → 멈춤. 출시 4주 뒤 숫자는 Jiwon이 읽고 다음 덩어리를 정한다 — 숫자가 0이어도 이 계획의 실패가 아니라 유입 경로의 과제다.

## 7. 가정과 미확인 — 실기기 검증은 따로 센다

| 가정 | 확인 시점 | 틀리면 |
|---|---|---|
| 허브의 Pretendard subset이 한글을 충분히 담는다 | WS1 첫 단계 | 공식 한글 subset 자체 호스팅(약 1 MB 이내로 서브셋) |
| CodeMirror 6에서 한글 IME 조합 중 Enter·⌘↩이 오동작하지 않는다 | WS2 단위 + G4 실기기 | `isComposing` 가드(현재 코드에 이미 있는 패턴) + 조합 종료 대기 |
| 엔진 진단이 학습자 문서와 target의 블록 수·순서가 같다고 전제한다(§3.2) | WS2 | 위치가 비면 문장만 보여주고(§4.1), 줄 지목이 자주 비면 WS2가 진단에 "가장 가까운 블록" 추정을 더한다 |
| 기존 영어 Level 1 문제의 starter 투영이 새 에디터에서 그대로 동작한다 | WS2 | 투영 함수(`plaintextStarter`)를 새 화면에 맞게 손본다 |
| Cloudflare beacon이 SPA 주소 변경을 센다(`spa` 옵션) | WS2 | 주소 변경 때 수동 pageview 호출 또는 경로별 실제 네비게이션 |
| 문제은행을 언어별 청크로 지연 로딩할 수 있다(정적 import 구조) | §3 지도 | 동적 import로 분리하는 작은 리팩터링을 WS2에 포함 |

실기기에서만 증명되는 것(시뮬레이터·자동화로 완료 처리하지 않는다): 한글 IME 입력, 효과음 재생, 다크 모드 실제 색, 휴대폰 키보드가 올라온 상태의 판정 바 위치.

## 8. 사전 승인 · 멈춤 · 항상 제외

**사전 승인(묻지 않고 한다)**
- 범위 안의 로컬 변경 전부, 파일·테스트 추가와 삭제, 옛 화면·CSS·턴·랭킹·레벨 코드 삭제.
- 의존성: 글꼴 파일 D2Coding(OFL)과 Pretendard(OFL) 추가, Source Serif 4·JetBrains Mono 제거. npm 패키지는 이름을 적은 것만: `@codemirror/lang-markdown`, `@codemirror/language`, `@lezer/highlight`(기호 하이라이트). 그 밖의 새 패키지는 멈춤.
- THIRD-PARTY-NOTICES·라이선스 페이지 재생성, README·SECURITY·CONTRIBUTING·changelog 갱신.
- 브랜치 push, PR 생성(draft 아님), Codex 리뷰 대응 라운드 — 이 계획은 **"PR까지"**를 포함한다. 이슈 코멘트.
- e2e 캡처, Playwright·vitest 실행, 로컬 빌드, `wrangler deploy --dry-run`.

**멈춤(묻고 턴을 끝낸다)**
- 배포(`deploy:cloudflare`), D1 마이그레이션(이 계획에는 없다), main 직접 push, merge.
- 시안 선택, 콘텐츠 표본 검수, 셋 다 거부·70% 미만 재시도 실패 같은 폐기 기준.
- 이름을 적지 않은 패키지 추가, 글꼴 구매, 외부 서비스 가입·키 발급.
- onsoonlabs 저장소의 PR 머지(허브는 Jiwon이 보고 머지한다).
- 기존 이슈 닫기(#2·#9·#16·#41·#42), 계획에 없는 범위 확대(예: Level 2 추가, 서버 진도).

**항상 제외:** EAS(해당 없음) · prod 마이그레이션 · main 직접 push · merge.

## 9. 세션 구성 · 모델 · effort

- 세션은 **nabimd 저장소에서 직접 연다**(cwd `~/develop/projects/nabimd`). `projects` 폴더의 세션 워크트리에서는 형제 저장소에 쓰기가 막힌다. 각 세션은 `git fetch origin && git worktree add .claude/worktrees/<ws> -b redesign/<ws> origin/main`으로 자기 워크트리를 만들고 `npm ci`한 뒤 그 안에서만 작업한다.
- 동시 작성자는 WS2와 WS3뿐이고 파일 소유권은 §5에 있다. 같은 파일을 두 세션이 만지지 않는다.
- 모델·effort(2026-11-03 기준 가용 모델, 권고값): WS1·WS2·WS4 = Fable 5.1 **high**(화면·설계 비중이 크다). WS3 = Fable 5.1 **medium**(생성·검증 반복, 정본 문서 읽기가 적다; 대안 Opus 5.5 medium). 올릴 신호: 시안 셋이 비슷하게 나오거나 한글 IME 문제가 재현되지 않을 때 xhigh로 한 번. 내릴 신호: WS3에서 픽스처 통과율이 90%를 넘으면 low로.
- 리뷰: PR마다 Codex 리뷰를 수렴까지(전역 §5). 머지는 Jiwon.
- 시간 예산은 주지 않는다 — 정본 문서(이 계획, intend.md, 엔진 코드)를 읽고 시작해야 하는 작업이다.

## 10. 재진입 · 상태 · 확정된 결정

**재진입 순서.** 이 문서 §10 상태 표 → `git log --oneline -20`(main과 `redesign/*` 브랜치) → `gh pr list --repo jiwonschol/nabimd` → 우산 이슈의 최근 코멘트. 문서가 git과 다르면 git이 맞다.

**트랙 상태(세션마다 갱신)**

| WS | 상태 | 브랜치 / PR | 마지막 갱신 |
|---|---|---|---|
| WS0 승인·등록 | 완료 — Jiwon 승인, 계획 PR #250, 이슈 #251(WS1)·#252(WS2)·#253(WS3)·#254(WS4)·#255(추적) | `claude/level-1-redesign-plan` / PR #250 | 2026-11-03 |
| WS1 시안 | **Jiwon 선택: A 목표 옆에 쓰기**(2026-11-04). 시안 A·B·C 구현, 캡처 18장·비교표·허브 비교 이미지(`docs/design/2026-11-redesign/variants/`), Codex 수렴. 머지 대기 | `claude/redesign-ws1-variants-fd280e` / PR #256 | 2026-11-04 |
| WS2 앱 뼈대 | 시작 가능 — 선택한 시안 = A. 이슈 #252 | — | 2026-11-04 |
| WS3 한국어 콘텐츠 | 대기(WS1과 동시 가능) — 이슈 #253 | — | 2026-11-03 |
| WS4 통합·출시 | 대기(WS2·WS3 머지 뒤) — 이슈 #254 | — | 2026-11-03 |

**확정된 결정(날짜) — 다시 안건으로 올리지 않는다**

- 2026-11-03 · B안: 다시 정의하고 다시 짓는다. A안(옛 틀에 Level 2·3 채우기) 기각, C안(보류) 기각.
- 2026-11-03 · 한국어 우선, 영어 유지(새 문제는 한국어, 기존 영어 문제는 영어 모드).
- 2026-11-03 · 진도는 브라우저(localStorage)에, 로그인 없음.
- 2026-11-03 · 디자인은 허브 결을 바닥으로 두고 시안 3개 중 Jiwon이 고른다.
- 2026-11-03 · 첫 배포는 Level 1만. AI 지시문 트랙은 다음 덩어리.
- 2026-11-03 · 타이머·레벨 잠금·책 메타포·페이지 넘김·자동 진행 제거. 계측은 첫 PR에.
- 2026-11-04 · 연습 화면 배치는 **시안 A(목표 옆에 쓰기)** — 왼쪽 목표, 오른쪽 에디터, 판정 바는 에디터 아래 오른쪽 정렬, 휴대폰은 상하 스택 + 아래 고정 판정 바. B·C와 `?variant=` 분기는 WS2가 지운다(PR #256의 캡처·비교표가 근거).

**계획 수정 기록.** 2026-11-03 · PR #250의 Codex 리뷰 반영: Setext 제목은 통과가 아니라 전용 안내(D11 유지), 표는 `table-shape` 술어를 WS3이 추가, 글자용 액센트 변형(`--acc-clay-text`·`--acc-leaf-text`)과 먹색 주 단추로 대비 4.5:1 확보.

**다음 덩어리(이 계획 밖, 출시 4주 뒤 Jiwon이 정한다).** "AI에게 주는 지시문 쓰기" 트랙 — 잠자는 Level 3~5 콘텐츠 86장(사람이 읽는 문서·개발 명세·에이전트 작업 지시서)을 한국어로 옮기고 같은 화면에서 긴 문서로 연습한다. 그다음이 GFM·Obsidian 같은 방언(#16).

## 부록 — 실행 프롬프트

각 블록은 새 세션에 그대로 붙여넣어 끝까지 돌 수 있게 썼다. `{{ }}` 자리만 채운다. 네 프롬프트가 공유하는 머리말은 A에 한 번 적고 B·C·D는 "공통 머리말 포함"으로 줄였다 — 붙여넣을 때는 A의 **공통 머리말**을 앞에 붙인다.

### 부록 A — WS1 시안 세션

```
[공통 머리말]
지원은 실시간으로 보고 있지 않고 작업 중 답할 수 없다. 되돌릴 수 있고 원 요청에서 따라오는 일은 묻지 말고 진행한다.

도구 호출 없는 메시지는 턴을 끝내고 작업을 멈춘다. 다음 넷으로 턴을 끝내지 않는다: ① 다음 단계를 예고만 하는 요약 ② "원하면 계속할게" 같은 제안 ③ 나머지를 막지 않는 결정 목록 ④ 길었으니·이정표니 보고하자는 판단. 상태 메모와 추천은 다음 도구 호출과 같은 메시지에 넣고 계속한다. 백그라운드 명령·서브에이전트가 아직 돌면 끝난 게 아니다.

작업이 요구하지 않는 버그·확장은 고치지 말고 요약에 후속 과제로 적는다. 요청받은 일이 끝나고 게이트가 통과하면 멈춰서 복귀 브리핑(부록 E 형식)을 쓴다.

시작 절차: cwd는 ~/develop/projects/nabimd (이 저장소에서 세션을 열어야 쓰기가 막히지 않는다).
  git fetch origin && git worktree add .claude/worktrees/{{ws}} -b redesign/{{ws}} origin/main && cd .claude/worktrees/{{ws}} && npm ci
먼저 읽을 것: dev-docs/plans/2026-11-03-level-1-redesign.md 전체(아직 main에 없으면 브랜치 claude/level-1-redesign-plan에서), ~/develop/projects/onsoonlabs/intend.md의 '제품 상세 페이지'와 '두 화면에 함께 걸리는 것', ~/develop/projects/onsoonlabs/site/shared/tokens.css와 base.css. 계획서 §2의 규칙과 §8의 사전 승인·멈춤 목록이 이 세션의 권한이다. PR은 draft가 아니라 열린 상태로 올리고 Codex 리뷰를 수렴까지 대응한다(전역 규칙 §5). PR마다 계획서 §10 상태 표의 자기 줄을 갱신해 같은 PR에 넣는다.
[공통 머리말 끝]

ws = ws1-variants

왜·누구를 위해: Nabi Markdown을 "상자에 기호 한 글자 넣기"에서 "짧은 실제 문서 한 장을 에디터에 마크다운으로 쓰기"로 다시 짓는다. 첫 단계가 이 시안이다. Jiwon은 화면을 보고 고르는 사람이고, 세 시안이 실제로 돌아가는 화면이어야 고를 수 있다. 허브(onsoonlabs.com)의 톺키·Wonboard 페이지 옆에 놓아도 한 식구로 보이는 것이 목표다.

할 일(순서대로):
1. 글꼴 확인. ~/develop/projects/onsoonlabs/site/assets/fonts/PretendardVariable.subset.woff2가 한글 2,350자(KS X 1001)를 담는지 fonttools 또는 브라우저 렌더로 확인한다. 부족하면 Pretendard 공식 배포본에서 한글 subset을 만들어 public/fonts/pretendard/에 둔다(OFL 1.1, 라이선스 파일 동봉). D2Coding Ver 1.4.0(naver/d2-coding-font, OFL 1.1)을 public/fonts/d2coding/에 둔다. Source Serif 4·JetBrains Mono는 아직 지우지 않는다(WS2가 옛 화면과 함께 지운다).
2. 토큰 이식. src/styles/tokens.css를 계획서 §4.7의 표대로 새로 쓴다(다크 모드 세트 포함). 글자용 짙은 변형 --acc-clay-text·--acc-leaf-text는 흰 바탕과 다크 바탕 각각에서 4.5:1 이상이 되는 값을 측정해 정하고, 측정값을 비교표 README에 적는다. 주 단추는 먹색 바탕에 흰 글자다. 옛 토큰을 쓰는 옛 화면은 깨져도 된다 — 이 세션의 화면은 ?variant= 아래에서만 보인다.
3. 표본 문서. src/content/ko/_samples.ts에 한국어 문서 3장을 기존 문제 스키마로 만든다(장보기 메모: 제목 1 + 목록 3 / 회의 메모: 제목·굵게·번호 목록 / AI 요청문: 제목·목록·인용). 실엔진(evaluateProblem)으로 정답이 통과하는지 테스트로 고정한다. WS3이 나중에 바꾼다.
4. 시안 셸. 주소에 ?variant=a|b|c가 있으면 옛 앱 대신 시안 화면을 띄우는 임시 분기를 src/App.tsx에 둔다. 세 시안은 계획서 §4.8의 배치를 따르고 색·글꼴은 같다. 에디터는 기존 MarkdownSourceEditor(CodeMirror)를 재사용하되 글꼴만 D2Coding으로 바꾼다(지금은 import 0건인 죽은 코드지만 테스트 632줄이 살아 있다 — 계획서 §3.1). 판정은 실제 엔진을 호출한다(가짜 상태 금지). 상태 셋(처음/다시/통과)은 실제 입력으로 만든다.
5. 캡처. tests/e2e/capture-redesign-variants.spec.ts를 만들어 NABI_WRITE_VARIANT_QA=1일 때 3 시안 × 2 폭(1280×800, 390×844) × 3 상태 = 18장을 docs/design/2026-11-redesign/variants/<variant>-<width>-<state>.png로 저장한다. 390폭에서 목표 첫 줄과 에디터 첫 줄의 bbox가 둘 다 viewport 안에 있는지, 가로 스크롤이 0인지 같은 스펙에서 단언한다. 허브 제품 페이지(https://onsoonlabs.com/topki/) 1280 캡처 한 장을 옆에 둔 비교 이미지 compare-with-hub.png도 만든다.
6. 비교표. docs/design/2026-11-redesign/variants/README.md에 시안별 캡처 표, 선택 기준(§4.8) 네 줄에 대한 자기 평가(측정값 포함), 묻지 않고 정한 것 목록을 쓴다.
7. PR. 제목 "design: Level 1 재설계 시안 A·B·C (계획 §4.8)". 본문에 18장 중 각 시안의 1280 '처음' 캡처 3장과 compare-with-hub.png를 넣는다. Codex 리뷰 대응.

사전 승인: 계획서 §8의 목록. 특히 @codemirror/lang-markdown, @codemirror/language, @lezer/highlight 추가는 허용.
멈춤(묻고 턴을 끝낸다): 시안 선택(Jiwon 몫), 목록에 없는 패키지, 글꼴 구매, 세 시안이 같은 배치로 수렴해 버려서 차이를 못 만들 때.
게이트 G1(계획서 §6): 캡처 18장 + README, 390폭 가로 스크롤 0, 첫 화면 동시 노출, 대비 4.5:1, 콘솔 오류 0, npm run typecheck 통과, 기존 테스트 중 토큰 교체로 깨진 것은 그 테스트가 옛 화면 전용이면 skip 표시(삭제는 WS2), 아니면 고친다.
재진입: 브랜치 redesign/ws1-variants. docs/design/2026-11-redesign/variants/가 있으면 5번부터, 없고 src/App.tsx에 variant 분기가 있으면 4번부터, 둘 다 없으면 1번부터.
복귀 브리핑: 부록 E. 마지막 줄은 "A / B / C 중 무엇으로 갈까?" 하나만 묻는다.
```

### 부록 B — WS2 앱 뼈대 세션 (WS1에서 시안이 정해진 뒤)

```
[공통 머리말 포함]  ws = ws2-app  선택한 시안 = {{A|B|C}}

왜·누구를 위해: 고른 시안을 제품으로 만든다. 사용자는 한국어로 마크다운을 처음 손에 붙이려는 사람이고, 로그인 없이 들어와 5분 안에 문서 한 장을 쓰고 배운 기호가 다음 방문까지 남아야 한다. 영어 사용자는 같은 화면을 영어 문제은행으로 쓴다.

할 일(PR 셋으로 나눈다):
PR 1 "뼈대·홈·연습": 
  - 주소 세 개(/nabimd/, /nabimd/practice, /nabimd/done)를 history로 다루는 얇은 라우터. NABI_BASE_PATH를 지킨다.
  - src/i18n/ko.ts·en.ts 사전과 useText 훅. 기본 언어는 localStorage onsoon-lang → navigator.language. 토글은 같은 키에 저장하고 <html lang>·<title>·meta를 바꾼다.
  - 홈 = 기호 지도(계획서 §4.1). 연습 = 선택한 시안(§4.8)의 배치로 §4.1의 요소(지시 한 줄, 목표, 에디터, 판정 바, 힌트 2단계, 2회 실패 뒤 정답 보기, 통과 뒤 비교, 다음 장). 자동 진행 없음.
  - 선택기: "오늘의 다섯 장"은 안 해본 기호 우선, 이웃한 장은 같은 기호 금지, 혼합 문서는 다섯 장 중 최대 하나. 기존 selection/runComposition의 가중치·턴 규칙은 쓰지 않는다.
  - 영어 모드: 기존 Level 1 164장과 Level 1 기호만의 혼합 문서를 curriculumElements의 분류로 고른다. 문제은행은 언어별 동적 import 청크로 나눈다.
  - 할 일 목록은 list-shape의 requireTaskItems 옵션으로 이미 채점된다(계획서 §3.2) — 표본 문제로 테스트만 추가한다. 표 모양 술어(table-shape)는 WS3이 structural.ts에 더하니 그 파일은 건드리지 않는다. Setext 제목은 통과시키지 않고 전용 안내 문구만 보여준다(옛 결정 D11). 엔진 안의 영어 문구(evaluateMatch.ts의 목록 공백 안내, matchDiagnostics.ts의 위치 라벨)와 리뷰 3개 제한을 엔진 밖 사전으로 옮기고 엔진은 키를 돌려주게 한다.
PR 2 "요약·진도·동의·다크":
  - 요약 화면(§4.1), 메모 폼은 기존 SummaryFeedbackForm을 한국어 사전으로.
  - 진도 저장 nabimd.learning.v1(§4.5) + 메모리 폴백 + "진도 지우기". 옛 nabimd.progress.v5와 nabimd.session-seed.v1(sessionStorage)은 읽지 않고 지운다.
  - 동의 배너 + Cloudflare beacon(§4.6). 동의 전 beacon 요청 0건을 e2e로 고정. 주소 변경을 beacon이 세는지 확인하고 안 되면 수동 pageview.
  - 다크 모드(토큰 세트 + 에디터 테마).
PR 3 "옛 화면 삭제·정리":
  - 계획서 §3.8의 삭제 목록(OpenBookLanding, WhyMarkdown, CardFirstPractice, CenterCard, EditorialDesk, ExerciseTopBar, ElapsedTime, VerdictNotice, WordProcessorPage, WritingProcessor, GoalPanel, AnswerPanel, src/guided, src/ranking, src/selection의 턴 기계, progressStore의 7단 마이그레이션, App의 history 스냅샷, 페이지 넘김 오버레이와 pageTurnSound, curriculumLevels의 3레벨, global.css 전체, src/sound/*.wav, 쓰이지 않는 이미지 3개)와 그 테스트를 지운다. 남기는 것: engine, markdown/parser, content(영어 데이터와 batches), MarkdownSourceEditor와 src/editor, feedback, browserStorage, monitoring, feedbackSound, worker. scripts/problem-bank의 배치 게이트와 src/content/batches는 이번에 건드리지 않는다(후속 과제).
  - 이 PR이 머지되는 순간부터 main은 배포 금지 구간이다 — 우산 이슈에 코멘트로 알린다.
  - Source Serif 4·JetBrains Mono 제거 + THIRD-PARTY-NOTICES 재생성.
  - 한국어 문자열 lint 스크립트 scripts/lint-ko-copy.mjs(해요체 0건, 컴포넌트 안 하드코딩 0건)를 npm run check에 넣는다.

사전 승인·멈춤: 계획서 §8. 추가 멈춤: 시안을 바꾸고 싶어질 때(바꾸지 말고 보고).
게이트 G2(계획서 §6) 전부. e2e 8 시나리오는 tests/e2e/redesign.spec.ts에.
재진입: 브랜치 redesign/ws2-app. PR 1·2·3 중 머지된 것을 gh pr list로 확인하고 다음 PR부터.
복귀 브리핑: 부록 E. 측정값(번들 KB, Lighthouse 점수, e2e 개수)을 표로.
```

### 부록 C — WS3 한국어 콘텐츠 세션 (WS0 뒤 언제든, WS2와 병렬)

```
[공통 머리말 포함]  ws = ws3-content-ko

왜·누구를 위해: 새 화면이 보여줄 한국어 문서 120장을 만든다. 학습자는 한국어로 일상·일·AI 요청문을 쓰는 사람이고, 문서는 읽는 순간 "내가 쓸 법한 글"이어야 한다. 채점은 구조만 보므로 산문은 자유롭되 짧아야 한다.

할 일:
1. 계획서 §3의 스키마와 src/content/types.ts, src/content/validateProblemBank.ts, src/engine/evaluateProblem.ts를 읽는다. 기존 Level 1 영어 문제 하나를 본으로 삼아 필드를 그대로 채운다. locale 필드가 없으면 "ko"|"en"을 추가하고 기존 데이터는 "en"으로 채운다(WS2와 겹치지 않게 types.ts의 이 한 줄만 만진다 — 충돌 나면 WS2가 먼저다).
2. 기호 12개 × 8장 + 혼합 24장을 src/content/ko/<기호>.ts·mixed.ts에 쓴다(§4.3의 유형 10, 길이, 금칙). 각 장에 픽스처 4개 이상(정답, 산문만 바꾼 변형, 기호 누락, 기호 오형)을 같은 파일 옆 <기호>.fixtures.ts에 둔다.
   표 문제를 쓰기 전에 table-shape 술어(머리 칸 수, 본문 행 수 min/max, 범위 옵션)를 src/engine/predicates/structural.ts와 src/content/types.ts에 더하고 단위 테스트로 고정한다(계획서 §4.2). WS2는 이 두 파일의 이 부분을 만지지 않는다.
3. scripts/content/ko-report.mjs: 장 수(기호별), 픽스처 통과율, 중복, 줄 길이, 금칙, 해요체를 표로 찍는다. 첫 통과율을 PR 본문에 적는다. 70% 미만이면 수량을 줄이지 말고 생성 지침(문서 유형·길이·기호 배치)을 고쳐 다시 쓴다. 두 번째도 미만이면 멈추고 보고한다.
4. 테스트: 픽스처 전부 실엔진 통과, validateProblemBank 통과, 중복 0을 vitest로 고정하고 npm run check에 포함.
5. PR 세 개(기호 4개씩). 각 PR 본문에 그 묶음에서 무작위 7장의 목표 렌더(마크다운 원문)를 붙여 Jiwon이 눈으로 볼 수 있게 한다(세 PR 합쳐 20장 이상).

사전 승인·멈춤: 계획서 §8. 추가: 표본 검수는 Jiwon 몫 — PR을 열고 다음 묶음으로 넘어간다(기다리지 않는다). 옛 배치 봉인 공정(scripts/problem-bank/*Batch*)은 쓰지도 고치지도 않는다.
게이트 G3(계획서 §6).
재진입: 브랜치 redesign/ws3-content-ko. src/content/ko/에 있는 파일 수로 어느 묶음까지 썼는지 본다.
복귀 브리핑: 부록 E. 기호별 장 수와 첫 통과율 표.
```

### 부록 D — WS4 통합·출시 준비 세션 (WS2·WS3 머지 뒤)

```
[공통 머리말 포함]  ws = ws4-release

왜·누구를 위해: 새 Level 1을 onsoonlabs.com/nabimd/에 내보낸다. 배포 자체는 Jiwon이 승인한 뒤에만 한다. 출시 뒤 4주의 숫자가 다음 덩어리를 정하므로 계측이 실제로 도는지가 이 세션의 핵심이다.

할 일:
1. e2e 전면 갱신: tests/e2e/*에서 옛 화면 스펙을 지우고, production-health.spec.ts를 새 흐름(홈 → 연습 한 장 통과 → 요약)으로 다시 쓴다. docs/production-health-monitoring.md의 runbook 문구도 맞춘다. .github/workflows/production-health.yml이 새 스펙을 가리키는지 확인.
2. 측정: axe(critical 0), Lighthouse 모바일(성능 85·접근성 95), 초기 JS 800 KB 이하, 언어별 청크 분리 확인. 수치를 docs/design/2026-11-redesign/release-check.md에 적는다.
3. 문서: README(세 이야기를 하나로 — 새 제품 설명, 스크린샷 교체, Build Week 문단은 '역사'로 한 문단), SECURITY.md Scope(localStorage·동의·통계 표), CONTRIBUTING, src/content/changelog.ts와 앱 안 변경 이력, 라이선스 페이지. 열린 이슈 #2·#9·#16·#41·#42에 "2026-11 재설계 뒤 재평가" 코멘트(닫지 않는다).
4. OG 이미지 1200×630(새 연습 화면 캡처 기반)과 meta 태그.
5. 리허설: npm run check 녹색, NABI_BUILD_SHA=$(git rev-parse HEAD) npm run build:cloudflare, wrangler deploy --dry-run 성공.
6. **멈춤**: 여기서 Jiwon에게 배포 승인을 묻고 턴을 끝낸다. 승인 메시지에 "배포"라는 말이 있어야 한다.
7. 승인 뒤: main 최신에서 NABI_BUILD_SHA=$(git rev-parse HEAD) npm run deploy:cloudflare(배포 뒤 라이브 SHA 검증까지 스크립트가 한다) → gh workflow run production-health.yml -f expected_sha=<SHA> → 녹색 확인 → 라이브에서 ko·en 각각 한 장 통과를 브라우저로 확인.
8. 허브: ~/develop/projects/onsoonlabs에서 워크트리를 만들고 site/products.json의 nabi-markdown 항목(tagline·headline·description·hero.more·specs의 '화면 언어: 한국어·영어', '진행 상황: 이 브라우저에 남음')과 캡처(site/assets/README.md의 규격대로)를 갱신해 PR을 연다. 머지는 Jiwon. 허브 /privacy/의 범위 문구는 바꾸지 않는다(nabimd는 자기 고지를 가진다).

사전 승인·멈춤: 계획서 §8. 배포는 6번의 승인 뒤에만. D1 마이그레이션은 없다 — deploy 스크립트의 migrations apply가 "적용할 것 없음"이어야 하고, 아니면 멈춘다.
게이트 G4(계획서 §6).
재진입: 브랜치 redesign/ws4-release. docs/design/2026-11-redesign/release-check.md가 있으면 3번부터; 라이브 SHA(onsoonlabs.com/nabimd/의 버전 표시)가 main과 같으면 8번부터.
복귀 브리핑: 부록 E. 배포 전이면 "배포해도 될까?" 하나만 묻는다.
```

### 부록 E — 복귀 브리핑 형식

Jiwon은 그 사이 과정을 하나도 못 봤다. 마지막 메시지는 작업의 연속이 아니라 재접지다.

1. **결과 한 문장** — 무슨 일이 일어났는가(예: "시안 세 개를 실제 화면으로 만들어 PR #N에 올렸고, Codex 지적 2건을 반영했다").
2. **보여줄 것** — 캡처·PR·측정값을 평범한 말로. 파일 경로는 한 번씩 풀어 쓴다("비교표는 저장소의 docs/design/2026-11-redesign/variants/README.md").
3. **확인하지 못한 것** — 실기기·사람 눈이 필요한 항목.
4. **묻는 것은 하나** — 계획이 정한 멈춤 조건의 질문만(시안 선택 / 표본 검수 / 배포 승인).
5. 작업 중 만든 축약어·이름표·화살표 체인을 쓰지 않는다. 짧음과 명확함이 부딪히면 명확함.
