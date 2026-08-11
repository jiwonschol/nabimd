# 문제은행 512 — 무인 주행

지원은 자고 있다. 실시간으로 보고 있지 않고, 알림도 원하지 않는다. 아침까지 혼자 돈다.
막히면 물어볼 사람이 없으므로, 되돌릴 수 있고 원 요청에서 따라오는 일은 묻지 말고 진행한다.

## 목표

승인된 문제를 372개에서 512개로 올린다. 부족분은 전부 L3~L5 다 — L4 48개, L5 58개,
L3 66개. 계단 순서대로 채우고, 각 배치는 저장소가 이미 가진 파이프라인 게이트를 통과해야만
은행에 들어간다. **검수를 통과하지 못한 문제는 한 개도 넣지 않는다.**

5시간 예산에 140개 전부는 어렵다. **미달로 끝나는 것이 기본 예상이고 실패가 아니다.**
배치 단위로 커밋되므로 다음 밤이 이어받는다. 숫자를 맞추려고 게이트를 낮추는 것만이 실패다.

## 표적

승인된 표적 셋. 각 표적은 **자기 레벨의 새 문제만** 판정한다.

| 레벨 | 표적 | 이 표적이 우리 문제를 푼 방식 |
| --- | --- | --- |
| L4 | `curriculum/problem-bank/batches/2026-07-22-l4-workplace-notes-021/candidates.normalized.json` | 012(938자)·017(1058자)로 부풀었던 L4 를 196자 업무 미니어처로 내려앉혔다 |
| L5 | `curriculum/problem-bank/batches/2026-07-22-l5-developer-forms-020/candidates.normalized.json` | 018 의 556자를 245자 개발자 폼으로 압축하면서 마크 밀도는 은행 최고(0.256)를 달성했다 |
| L3 | `curriculum/problem-bank/batches/2026-07-19-l3-readable-documents-010/candidates.normalized.json` | **장르만** 가져온다. 길이는 따르지 않는다 — 010 은 중앙 383자로 320자 상한을 넘는다 |

주행 중 표적을 바꾸지 않는다. 열리지 않으면 판정하지 말고 `blocked` 으로 기록한다.

**소유자의 구속 조건 한 문장:** 학습자는 마크다운 문법만 판단한다. 빈칸에 들어가는 것은
문법이 요구하는 문자뿐이고 산문 글자는 이미 화면에 있다. 그러므로 문제의 산문은 문법을
실을 그릇이지 학습자가 읽어내야 할 과제가 아니다.

## 눈금

```bash
node scripts/loop/bank-gauges.mjs
```

| id | 필드 | 목표 | 우선순위 |
| --- | --- | --- | --- |
| deficitTotal | `deficitTotal` | `== 0` | 1 |
| violations.tooLong | `violations.tooLong` | `== 0` | 2 |
| violations.tooSparse | `violations.tooSparse` | `== 0` | 3 |
| violations.markSpam | `violations.markSpam` | `== 0` | 4 |
| violations.duplicate | `violations.duplicate` | `== 0` | 5 |
| violations.skeletonMonotony | `violations.skeletonMonotony` | `== 0` | 6 |
| baselineIntact | `baselineIntact` | `== 1` | 7 |
| gatesPass | `gatesPass` | `== 1` | 8 |

눈금끼리 충돌하면 우선순위가 낮은 쪽을 희생한다. 즉 **개수(1번)보다 품질(2~6번)이 아래가
아니다** — 위반을 남긴 채 개수를 채우면 안 된다. 위반이 나오면 그 문제를 고치거나 버린다.

문턱은 `scripts/loop/bank-gauges.mjs` 안에 있고 봉인됐다. 계측기와 임계값을 수정하지 않는다.
종료 시 해시로 대조된다. `offenders` 필드가 위반한 문제 id 와 사유를 최대 40건 보여준다.

## 회차 절차

1. `.claude/loop/NOTES.md` 를 읽는다. 새 지시가 있으면 그것이 이 문서보다 우선한다.
2. 눈금을 잰다: `node scripts/loop/bank-gauges.mjs`
3. `.claude/loop/problem-bank-512.log.jsonl` 에 한 줄 append:
   `{"round": n, "ts": "...", "metrics": {...}, "judge_model": null, "verdict": null}`
4. 계단의 현재 단계에 해당하는 배치 **하나**를 만들어 게이트를 통과시키고 커밋한다.
5. 그 레벨의 계단 목표에 눈금이 닿으면 심판을 부른다 (아래 "심판" 절).
6. 다음 회차로 간다.

한 회차 = 배치 하나다. 배치 하나는 12개 안팎이 검증된 크기다(021 이 12개, 020 이 12개).
한 번에 48개를 만들려 하지 않는다 — 게이트가 한 번 깨지면 그 회차가 통째로 날아간다.

## 배치 만드는 법

21개 선례가 있고 전부 같은 형태다. **`021` 을 복사해 시작한다** — 계단 1단이 L4 이고
021 이 L4 표적이므로 구조가 가장 가깝다.

한 배치가 건드리는 파일:

```
src/content/batches/<이름>Batch0NNProblems.ts      문제 레코드
src/content/batches/<이름>Batch0NNFixtures.ts      실엔진 픽스처
scripts/problem-bank/<이름>Batch0NNSupport.ts      빌드·검증·발행 로직  (021: 91줄)
scripts/problem-bank/<이름>Batch0NNArtifacts.gate.ts  게이트           (021: 139줄)
package.json                                      generate·publish·check 3줄 추가
curriculum/problem-bank/batches/<날짜>-<이름>-0NN/ 생성물(게이트가 쓴다)
```

절차:

```bash
npm run bank:batch:<이름>-0NN:generate   # 후보 → 정규화 → 픽스처 생성
npm run bank:batch:<이름>-0NN:check      # 실엔진 대조, 다이제스트 결속
npm run bank:batch:<이름>-0NN:publish    # 은행에 발행
npm run bank:generate                    # 트래커·발행 산출물 재생성
npm run bank:repository:gate             # 발행 산출물 ↔ 배치 아티팩트 대조
npm run bank:gate
```

각 배치는 **두 건의 독립 리뷰와 한 건의 편집 결정**을 가진다(기존 21개 전부 그렇다).
리뷰어·실행 ID 를 서로 다르게 declare 하고, `review-manifest.json` 이 후보·문제·픽스처
정의·픽스처 결과·엔진 다이제스트를 결속한다. 이 구조를 그대로 따른다.

배치 번호는 022 부터 이어간다. 배치 id 는 `<YYYY-MM-DD>-<설명>-0NN` 형식이다.

## 문제를 쓸 때

- L4 는 **업무 미니어처** — 인수인계 메모, 이슈 노트, 프로세스 변경 공지 같은 것. 196자 근처.
- L5 는 **개발자 폼** — README 빠른시작, 버그리포트, PR 설명, 에이전트 작업 지시서. 245자 근처.
- L3 는 **사람이 읽기 좋은 문서** — 장르는 010 을 따르고 길이는 320자 이하로 압축한다.
- 어휘는 레벨에 맞춘다. L3 는 일상적 업무 어휘, L4 는 개발 스펙 어휘, L5 는 에이전트 워크플로 어휘.
- 영어는 실제 직장·개발 현장에서 쓰는 문장으로 쓴다. 계측기는 이것을 재지 못한다.
- **구조를 돌려 쓴다.** 같은 골격에 어휘만 갈아끼우면 골격 눈금이 잡는다. 헤딩 깊이, 리스트
  종류, 인용, 코드 펜스, 링크를 배치마다 다르게 조합한다.
- 지시문과 힌트가 정답의 마크를 그대로 알려주지 않게 한다.

## 심판

계단의 한 단계가 눈금에 닿으면 부른다. 매 회차 부르지 않는다.

```bash
node scripts/loop/render-fresh.mjs --level <N> > .claude/loop/rounds/<R>/fresh.md
```

- 모델 **fable**, 프롬프트 `.claude/loop/problem-bank-512.judge.md`
- 심판에게는 `fresh.md` 만 준다. JSON 레코드·픽스처·리뷰 문서·diff 를 주지 않는다.
- 판정을 같은 로그 줄에 `judge_model` 과 `verdict` 로 기록한다.
- **심판 모델을 쓸 수 없으면 다른 모델로 대체하지 말고 중단한다.** 상태를 남기고 사유를
  기록한다. 빌더 모델로 내려가면 교차검증이 무의미해진다.
- 심판이 `fail` 을 내면 지적된 문제를 고치거나 배치에서 뺀다. 판정을 흥정하지 않는다.

## 정지

- **도달** — `deficitTotal == 0` 이고 `violationTotal == 0` 이고 `gatesPass == 1`,
  그 상태에서 심판이 `pass`.
- **안전정지** — 예산 5시간, 또는 정체 3회차(연속 3회차 동안 `acceptedTotal` 이 늘지 않음).

정체가 오면 **구현 접근법을 바꿔 재시도한다.** 목표와 눈금은 바꾸지 않고, 멈추지도 않는다.
전환할 때마다 사유를 로그에 남긴다. 계단 한 단이 끝났는데 예산이 남으면 다음 단으로 올린다:
L4 80개 → L5 80개 → L3 96개 → L1·L2 계열 다양성.

**완료를 스스로 선언하지 않는다.**

```bash
python3 ~/.claude/skills/goal-harness/scripts/verify.py .claude/loop/problem-bank-512.md
```

이것이 출력한 문구를 그대로 한 번 적는다. 출력이 없으면 완료가 아니다. verify 가 미달을
내면 계속 돌거나, 예산이 끝났으면 미달로 보고한다.

## 봉쇄

- 눈금·임계값·심판 프롬프트를 수정하지 않는다. 봉인되어 있고 종료 시 해시로 대조된다.
- 테스트·실패 케이스를 삭제하거나 스킵하지 않는다. 게이트를 통과하지 못하는 배치는
  통과시키는 게 아니라 버린다.
- `main` 에 직접 커밋·push 하지 않는다. `loop/problem-bank-512` 브랜치에만 커밋한다.
- 외부 전송·결제·설치를 하지 않는다. `npm install` 을 포함한다. 웹 크롤링도 금지다(이슈 #9).
- 기존 21개 배치 디렉터리와 그 안의 다이제스트·리뷰·편집 결정을 수정하지 않는다.
- `src/` 중 쓰는 것은 `src/content/` 뿐이다. `src/components`·`src/engine`·`src/guided`·
  `src/selection`·`src/styles` 는 다른 트랙 소유다.
- 판정을 정확문자열 대조로 바꾸지 않는다. 학습자 앱에 런타임 AI 호출을 넣지 않는다.
- 빈칸 정책을 바꾸지 않는다 — 학습자가 채우는 것은 마크다운 문법 문자뿐이다.
- `.claude/loop/.nonce` 를 읽지 않는다.

**이미 실패한 접근법(반복 금지).** ① 문제가 너무 길어졌다 — 017 에서 L4 중앙 1058자·
L3 824자까지 부풀어 018 이 대체해야 했다. ② 같은 문서가 어휘만 바뀐 채 반복된다.
둘 다 소유자가 직접 지목했고 각각 `tooLong` 과 `skeletonMonotony`·`duplicate` 로 눈금에 박혔다.

## 사전 승인 (묻지 말고 진행)

배치 생성·검증·발행, `scripts/problem-bank/` 와 `src/content/batches/` 의 새 파일 작성,
`package.json` 에 배치 스크립트 3줄 추가, 커리큘럼 문서 갱신, `loop/problem-bank-512`
브랜치 커밋, **게이트를 통과한 배치의 draft PR 생성**(`Refs #9`).

**사전 승인에서 제외 — 하지 않는다:** 빌드·배포, 프로덕션 마이그레이션, `main` 으로의
push 나 merge, draft PR 의 ready 전환, 패키지 설치·삭제, 제품 정책 변경.

## 소통

첫 도구 호출 전에 무엇을 할지 한 문장. 작업 중에는 중요한 발견이나 방향 전환이 있을 때만
짧게. 끝낼 때는 결과부터 — 첫 문장이 "무슨 일이 있었나"에 답하고 근거는 그 뒤에.

## 위임

배치 생성처럼 독립적이고 규모 있는 갈래에만 서브에이전트를 쓴다. 몇 번의 도구 호출로
끝날 일은 직접 한다. **자기 작업을 검증·재확인하는 용도로 서브에이전트를 쓰지 않는다** —
검증은 게이트와 독립 심판이 소유한다. 동시 실행은 3개를 넘기지 않는다.

## 아침 보고서

마지막에 `.claude/loop/MORNING.md` 에 이 형식으로 남긴다.

```
결론 — 한 줄. 정지조건 중 무엇으로 멈췄는지
눈금 — 지표별 시작 → 끝 (특히 acceptedTotal 372 → ?)
미해결 — 심판이 마지막까지 지적한 것 최대 3개
결정 — 사람이 정해야 할 것 (없으면 "없음")
되돌리기 — 브랜치명과 시작 커밋
```

이 요약은 과정을 하나도 보지 못한 사람이 읽는 첫 화면이다. 작업하며 만든 약칭·중간 개념·
화살표 축약을 쓰지 않는다. 결론부터, 용어는 풀어서, 완전한 문장으로 쓴다. 배치 번호나
눈금 이름을 그대로 던지지 말고 무엇을 뜻하는지 한 마디로 풀어 쓴다.
