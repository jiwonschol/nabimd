# 루프 — 문제은행 512

이슈 #9 의 마지막 구간. 승인된 문제 372개를 512개로 올린다. 부족분은 전부 L3~L5 이고,
이 세 레벨은 **장문 문서** 구간이라 가장 비싸다. 작성 2026-08-12. 두 번째 이후 주행은
심문을 반복하지 않고 이 파일을 읽는다.

## 소유자의 말 (비협상)

- **학습자는 마크다운 문법만 판단한다.** 빈칸에 들어가는 것은 문법이 요구하는 문자뿐이다.
- 문제는 그럴듯해야 하지만 **너무 길면 안 된다.** nabimd 는 지금 정체성을 찾아가는 중이고,
  긴 산문은 그 정체성을 흐린다.
- 게이트는 숫자보다 위다. **검수를 통과하지 못한 문제는 한 개도 넣지 않는다** (이슈 #9).

## 1. 표적 — "잘 만들어졌다"를 무엇과 대조하는가

구현 레퍼런스가 아니라 **평가 레퍼런스**다. 전부 이 저장소 안의 승인된 배치이고,
전부 실제로 열린다.

| 배치 | 레벨 | 중앙 길이 | 판정 |
| --- | --- | --- | --- |
| `2026-07-22-l4-workplace-notes-021` | L4 | **196자** | **채택** — L4 표적 |
| `2026-07-22-l5-developer-forms-020` | L5 | **245자** | **채택** — L5 표적 |
| `2026-07-19-l3-readable-documents-010` | L3 | 383자 | **채택(장르만)** — 길이는 320자 상한이 우선 |
| `2026-07-22-advanced-document-replacements-018` | L4·L5 | 464·556자 | 기각 — 020·021 이 더 나아간 형태 |
| `2026-07-20-l3-l5-advanced-documents-017` | L3~L5 | 824~1058자 | **기각 — 실패 사례.** 018 이 대체했다 |

**혼용 근거.** 세 표적은 서로 섞이지 않는다. 각 표적은 **자기 레벨의 새 문제만** 판정한다.
L3 는 사람이 읽는 산문 문서, L4 는 업무 미니어처, L5 는 개발자 폼 — 장르가 다르고,
하나의 표적으로 셋을 판정하면 심판이 기준 없이 흔들린다.

**L3 만 예외 처리가 붙는다.** 020·021 은 "컴팩트" 교정을 받았지만 **L3 는 그 교정을 받은
적이 없다** (010 383자 → 011 494자 → 017 824자로 오히려 늘었다). 그래서 010 에서는
*장르*만 가져오고 길이는 소유자가 승인한 320자 상한을 따른다. 010 보다 길면 표적 준수가
아니라 위반이다.

## 2. 연출대

```bash
node scripts/loop/bank-gauges.mjs                    # 눈금 JSON
node scripts/loop/render-fresh.mjs --level 4 \
  > .claude/loop/rounds/<N>/fresh.md                 # 심판이 볼 학습자 시점 산출물
```

결정론적이다 — 발행된 문제 레코드에서만 읽고 난수·시각에 의존하지 않는다.
심판은 `fresh.md` 만 본다. JSON 레코드·픽스처·리뷰 문서·diff 는 빌더가 이미 본 것이라
심판에게 주면 관점 하나를 두 번 보는 셈이 된다.

## 3. 눈금

**문턱은 `scripts/loop/bank-gauges.mjs` 안에 있고 preflight 가 그 파일을 봉인한다.**
루프 파일에 두면 밤중에 조용히 완화될 수 있다. 문턱을 바꾸면 verify 의 봉인 대조에서 걸린다.

| 눈금 | 문턱 근거 (전부 승인된 기존 배치 실측) |
| --- | --- |
| `deficitTotal` | `curriculum-v2.json` 의 레벨별 `minimumAccepted` — L3 96 · L4 80 · L5 80 |
| `violations.tooLong` | L4 260자 (021 최대 212) · L5 320자 (020 최대 264) · L3 320자 (소유자 승인) |
| `violations.tooSparse` | 마크 밀도 하한 — L4 0.07 (021 최저 0.072) · L5 0.13 (020 최저 0.140) · L3 0.045 |
| `violations.markSpam` | 마크 줄당 산문 단어 중앙값 하한 — L3·L4 3, L5 2 (실측 최소와 동일) |
| `violations.duplicate` | 트라이그램 유사도 0.30 (기존 최대 L3 0.056 · L4 0.080 · L5 0.143) |
| `violations.skeletonMonotony` | 골격 점유율 0.25 (기존 최대 L5 0.182) |
| `baselineIntact` | 기존 372문제의 본문 다이제스트 불변 |
| `gatesPass` | `bank:generate:check` · `bank:gate` · `bank:repository:gate` 전부 통과 |

**길이·밀도·단어수·중복·골격 눈금은 이 루프가 새로 만든 문제에만 적용된다.** 기존 21개
배치는 다이제스트로 봉인된 불변 자산이고(017 의 824자 문제 포함), 은행 전체에 소급하면
눈금이 시작부터 빨간불이라 영원히 켜지지 않는다. 대신 `baselineIntact` 가 변조를 잡는다.

### 왜 눈금이 여덟 개인가 — 관문 B 에서 뚫린 기록

세 개로 시작했다가 두 번 뚫렸다. 뚫린 자리마다 눈금이 하나씩 생겼다.

1. **길이 상한만 있을 때** — 320자 안에 마크 두 개만 넣고 나머지를 산문으로 채우면
   통과한다. 실측: 233자 · 밀도 0.009 로 길이 눈금 통과. → `tooSparse` 추가.
2. **길이 + 밀도일 때** — `# Alpha / # Beta / # Gamma` 나열은 68자 · 밀도 0.265 로 둘 다
   통과한다. 문법 나열이지 문서가 아니다. → `markSpam` 추가 (마크 줄당 단어 1개에서 잡힘).
3. **중복도만 있을 때** — 어휘만 갈아끼운 동일 골격 20개는 트라이그램 유사도 0.071 로
   통과한다. 이것이 소유자가 겪은 "같은 문서가 반복된다"의 실제 형태다.
   → `skeletonMonotony` 추가 (골격 점유율 1.000 에서 잡힘).
4. **저장소 게이트를 잘못 골랐을 때** — 발행 파일 `runtime-projections.generated.json` 을
   손으로 고쳐 승리를 조작하는 경로가 열려 있었다. `bank:generate:check` 와 `bank:gate` 는
   **이것을 잡지 못한다** (교정에서 실측). 발행 산출물을 배치 아티팩트와 대조하는 것은
   `bank:repository:gate` 뿐이다. → `gatesPass` 에 편입.

**남은 구멍은 하나이고, 심판이 소유한다.** 길이·밀도·단어수·중복·골격을 전부 만족하면서
영어가 부자연스럽거나 장르가 어긋난 문제는 기계가 재지 못한다. 심판 프롬프트가 이 항목을
명시적으로 맡는다.

## 4. 정지

- **(A) 도달** — `deficitTotal == 0` 이고 `violationTotal == 0` 이고 `gatesPass == 1`,
  그 상태에서 심판이 `pass`.
- **(B) 안전정지** — 예산 5시간, 또는 정체 3회차.

5시간에 140문제 전부는 어렵다. **미달로 끝나는 것이 기본 예상이고 그것은 실패가 아니다.**
배치 단위로 커밋되므로 다음 밤이 이어받는다.

## 5. 계단

1. L4 를 80개로 (48개 추가) — 표적 021 이 있고 문제가 가장 짧아 회차당 비용이 최저
2. L5 를 80개로 (58개 추가) — 표적 020
3. L3 를 96개로 (66개 추가) — 새 컴팩트 규격을 처음 적용받는 구간이라 마지막
4. 남으면 L1·L2 계열 다양성 (minimum 은 이미 충족)

## 6. 이 파일의 기계 부분

```json
{
  "name": "problem-bank-512",
  "target": {
    "approved_by_human": true,
    "approved_at": "2026-08-12T01:15+09:00",
    "approved_note": "소유자에게 배치 9개의 길이 실측표를 제시했고, 표적 선택은 위임하되 '그럴듯하되 너무 길지 않게, 학습자가 마크다운 문법만 판단하게'라는 구속 조건을 받았다. L3 320자 상한과 계단 순서(L4→L5→L3)는 소유자가 직접 선택했다.",
    "merge_rationale": "세 표적은 섞이지 않는다. 각 표적은 자기 레벨의 새 문제만 판정한다 — L3 산문 문서 / L4 업무 미니어처 / L5 개발자 폼은 장르가 달라, 하나로 셋을 판정하면 심판이 기준 없이 흔들린다. L3 의 010 은 장르만 제공하고 길이는 320자 상한이 우선한다.",
    "candidates": [
      {
        "id": "batch-021-l4-workplace-notes",
        "ref": "curriculum/problem-bank/batches/2026-07-22-l4-workplace-notes-021/candidates.normalized.json",
        "adopted": true,
        "rebuttal": "L4 의 길이 문제를 실제로 푼 배치다. 012(938자)·017(1058자)로 부풀었던 L4 를 196자 업무 미니어처로 내려앉혔고, 348개 고정 픽스처와 두 건의 독립 리뷰를 통과했다. 새 L4 48개는 이 규격과 나란히 놓고 판정한다."
      },
      {
        "id": "batch-020-l5-developer-forms",
        "ref": "curriculum/problem-bank/batches/2026-07-22-l5-developer-forms-020/candidates.normalized.json",
        "adopted": true,
        "rebuttal": "L5 의 같은 문제를 푼 배치다. 018 의 556자를 245자 개발자 폼(README 빠른시작·버그리포트·PR 설명)으로 압축했고, 마크 밀도가 0.256 으로 은행에서 가장 높다 — 짧으면서 문법을 가장 많이 싣는 형태를 실제로 달성했다."
      },
      {
        "id": "batch-010-l3-readable-documents",
        "ref": "curriculum/problem-bank/batches/2026-07-19-l3-readable-documents-010/candidates.normalized.json",
        "adopted": true,
        "rebuttal": "L3 장르의 유일한 기준점이다. '사람이 읽기 좋은 문서'가 무엇인지는 이 배치가 정의한다. 다만 길이는 표적으로 삼지 않는다 — 010 은 컴팩트 교정을 받은 적이 없고 중앙 383자로 320자 상한을 넘는다. 장르만 가져오고 길이는 상한이 이긴다."
      },
      {
        "id": "batch-018-advanced-document-replacements",
        "ref": "curriculum/problem-bank/batches/2026-07-22-advanced-document-replacements-018/candidates.normalized.json",
        "adopted": false,
        "rebuttal": "과장된 길이를 처음 되돌린 배치라 역사적 의미가 있지만, 464·556자로 020·021 보다 뒤에 있다. 같은 방향의 더 나아간 표적이 있는데 중간 단계를 표적으로 삼을 이유가 없다."
      },
      {
        "id": "batch-017-advanced-documents",
        "ref": "curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/candidates.normalized.json",
        "adopted": false,
        "rebuttal": "기각. 소유자가 말한 '문제가 너무 길어졌다'의 실물이다 — L4 중앙 1058자, L3 824자. 018 이 이 배치의 과장된 개정본들을 대체했다. 표적이 아니라 반면교사로만 기록한다."
      }
    ]
  },
  "stage": {
    "gauge": "node scripts/loop/bank-gauges.mjs",
    "render": "node scripts/loop/render-fresh.mjs --level <N> > .claude/loop/rounds/<R>/fresh.md",
    "determinism": "발행된 문제 레코드에서만 읽는다. 난수·시각·경로 의존 없음.",
    "judge_sees": "학습자 시점으로 굳힌 fresh.md 만. JSON 레코드·픽스처·리뷰·diff 는 주지 않는다."
  },
  "metrics": [
    {
      "id": "deficitTotal",
      "priority": 1,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "deficitTotal",
      "goal": "== 0",
      "geometric_basis": "curriculum-v2.json 의 레벨별 minimumAccepted 와 발행된 문제 레코드의 실제 개수 차이. 빌더가 쓰는 합격 플래그·트래커 요약을 읽지 않는다."
    },
    {
      "id": "violations.tooLong",
      "priority": 2,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "violations.tooLong",
      "goal": "== 0",
      "geometric_basis": "문제 target 문자열의 길이. 문서 본문 자체의 성질이라 빌더가 계측기를 움직일 수 없다. 문턱은 봉인된 계측기 안에 있다."
    },
    {
      "id": "violations.tooSparse",
      "priority": 3,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "violations.tooSparse",
      "goal": "== 0",
      "geometric_basis": "target 안에서 마크다운 문법이 요구하는 문자 수 / 전체 문자 수. 산문 글자는 세지 않는다."
    },
    {
      "id": "violations.markSpam",
      "priority": 4,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "violations.markSpam",
      "goal": "== 0",
      "geometric_basis": "마크가 붙은 줄에 실린 산문 단어 수의 중앙값. 밀도 눈금이 못 잡는 문법 나열을 잡는다."
    },
    {
      "id": "violations.duplicate",
      "priority": 5,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "violations.duplicate",
      "goal": "== 0",
      "geometric_basis": "새 문제 target 과 은행 전체 target 사이의 토큰 트라이그램 자카드 최대값."
    },
    {
      "id": "violations.skeletonMonotony",
      "priority": 6,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "violations.skeletonMonotony",
      "goal": "== 0",
      "geometric_basis": "산문 토큰을 W 로 치환한 구조 골격의 최빈 점유율. 어휘만 바뀐 판박이를 잡는다."
    },
    {
      "id": "baselineIntact",
      "priority": 7,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "baselineIntact",
      "goal": "== 1",
      "geometric_basis": "주행 전 봉인한 기존 372문제의 본문 sha256. 불변 배치를 손대면 즉시 false."
    },
    {
      "id": "gatesPass",
      "priority": 8,
      "script": "scripts/loop/bank-gauges.mjs",
      "run": "node {sealed}",
      "field": "gatesPass",
      "goal": "== 1",
      "geometric_basis": "저장소가 이미 소유한 게이트 세 개의 종료 코드. 특히 bank:repository:gate 는 발행 산출물을 배치 아티팩트와 대조한다 — 발행 파일을 손으로 써넣어 승리를 조작하는 경로를 막는 유일한 게이트다."
    }
  ],
  "calibration": {
    "sensitivity": [
      {
        "metric": "deficitTotal",
        "caught": true,
        "injection": "L4 에 새 문제 48개 주입 → deficitTotal 172 → 124"
      },
      {
        "metric": "violations.tooLong",
        "caught": true,
        "injection": "920자 L4 문제 1개 주입 → tooLong 0 → 1"
      },
      {
        "metric": "violations.tooSparse",
        "caught": true,
        "injection": "233자·밀도 0.009 산문 덩어리 → tooSparse 0 → 1 (tooLong 은 0 유지)"
      },
      {
        "metric": "violations.markSpam",
        "caught": true,
        "injection": "68자·밀도 0.265 마크 나열 → markSpam 0 → 1 (tooLong·tooSparse 는 0 유지)"
      },
      {
        "metric": "violations.duplicate",
        "caught": true,
        "injection": "020 문제의 어휘만 바꾼 복제본 → duplicate 0 → 1"
      },
      {
        "metric": "violations.skeletonMonotony",
        "caught": true,
        "injection": "동일 골격 20개 주입 → skeletonMonotony 0 → 1 (duplicate 은 0 유지, 유사도 0.071)"
      },
      {
        "metric": "baselineIntact",
        "caught": true,
        "injection": "봉인된 기존 문제 본문 수정 → true → false"
      },
      {
        "metric": "gatesPass",
        "caught": true,
        "injection": "발행 산출물 직접 수정 → gatesPass 1 → 0 (bank:repository:gate 가 잡는다)"
      }
    ],
    "validity": [
      {
        "metric": "deficitTotal",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "규격 위반 문제로 개수만 채우기 / 발행 파일에 가짜 문제 써넣기. 전자는 violations 5종이, 후자는 gatesPass 가 막는다."
      },
      {
        "metric": "violations.tooLong",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "상한 안에서 산문만 채우기 — 실제로 뚫렸고 그래서 tooSparse 를 추가했다. 현재 눈금 집합으로는 막힌다."
      },
      {
        "metric": "violations.tooSparse",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "마크만 빽빽하게 나열하기 — 실제로 뚫렸고 그래서 markSpam 을 추가했다. 현재 눈금 집합으로는 막힌다."
      },
      {
        "metric": "violations.markSpam",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "단어 수는 채우되 같은 문장을 반복하기 → skeletonMonotony 와 duplicate 이 막는다."
      },
      {
        "metric": "violations.duplicate",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "어휘를 전부 갈아끼워 트라이그램을 흩기 — 실제로 뚫렸고 그래서 skeletonMonotony 를 추가했다."
      },
      {
        "metric": "violations.skeletonMonotony",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "골격을 흔들면서 무의미한 문서 만들기. 기계로는 막지 못한다 — 이 잔여 구멍은 심판 프롬프트가 명시적으로 소유한다(영어 자연스러움·장르 적합성)."
      },
      {
        "metric": "baselineIntact",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "baseline-batches.json 을 고쳐 새 배치를 '기존'으로 위장하기 → seal_extra 로 봉인되어 verify 가 잡는다."
      },
      {
        "metric": "gatesPass",
        "broke": false,
        "attacker": "opus-5-primary-session",
        "attempt": "게이트를 통과하는 최소 아티팩트만 만들고 내용은 부실하게 하기 → 길이·밀도·단어수 눈금과 심판이 막는다."
      }
    ],
    "attacker_caveat": "관문 B 의 공격자가 빌더와 같은 모델 계열(opus-5)이다. 관점이 상관될 위험이 있다. 다만 공격은 의견이 아니라 실제 주입과 실측으로 수행됐고, 두 번은 실제로 뚫려 눈금이 두 개 늘었다. 주행 중 심판은 fable 이다."
  },
  "judge": {
    "model": "fable",
    "prompt_file": ".claude/loop/problem-bank-512.judge.md",
    "when": "레벨 하나의 계단 목표에 눈금이 닿았을 때만 호출한다. 매 회차 부르지 않는다."
  },
  "blocks": [
    "눈금·임계값·심판프롬프트 수정 금지 — 문턱은 scripts/loop/bank-gauges.mjs 안에 있고 봉인됐다",
    "테스트·실패케이스 삭제·스킵 금지 — 게이트를 통과하지 못하는 배치는 버리지 통과시키지 않는다",
    "main 직접 커밋·push·배포 금지 — loop/problem-bank-512 브랜치에만 커밋한다",
    "외부 전송·결제·설치 금지 — npm install 을 포함한다. 웹 크롤링도 금지(이슈 #9)",
    "기존 21개 배치 디렉터리와 그 안의 다이제스트·리뷰·편집 결정을 수정하지 않는다",
    "src/ 중 이 루프가 쓰는 것은 src/content/ 뿐이다 — 새 배치의 Problems·Fixtures 파일과 은행 등록부. src/components·src/engine·src/guided·src/selection·src/styles 는 트랙 B 소유이고 건드리지 않는다",
    "src/engine/ 의 판정 의미를 바꾸지 않는다 — 레벨 3~5 문서 구조용 새 술어 추가는 이슈 #9 범위지만, 이번 밤에는 기존 술어로 표현 가능한 문제만 만든다",
    "정답 판정을 정확문자열 대조로 바꾸지 않는다 (이슈 #9)",
    "학습자 앱에 런타임 AI 호출을 넣지 않는다 — 생성·검증은 전부 빌드타임 도구다",
    "빈칸 정책을 바꾸지 않는다 — 학습자가 채우는 것은 마크다운 문법 문자뿐이다",
    ".claude/loop/.nonce 를 읽지 않는다"
  ],
  "stop": {
    "reach": "node scripts/loop/bank-gauges.mjs 의 deficitTotal == 0 이고 violationTotal == 0 이고 gatesPass == 1 이며, 그 상태에서 심판이 pass 를 냈다",
    "safety": {
      "budget_hours": 5,
      "plateau_rounds": 3
    },
    "plateau_definition": "연속 3회차 동안 acceptedTotal 이 하나도 늘지 않으면 접근법을 바꿔 재시도하고, 그래도 늘지 않으면 상태를 보존하고 멈춘다"
  },
  "ladder": [
    "1단 — L4 를 80개로 (48개 추가). 표적 021, 문제가 가장 짧아 회차당 비용 최저",
    "2단 — L5 를 80개로 (58개 추가). 표적 020",
    "3단 — L3 를 96개로 (66개 추가). 새 컴팩트 규격을 처음 적용받는 구간이라 마지막",
    "4단 — 예산이 남으면 L1·L2 계열 다양성 확장 (minimum 은 이미 충족)"
  ],
  "mandatory": {
    "failed_approaches": "① 문제가 너무 길어졌다 — 017 에서 L4 중앙 1058자·L3 824자까지 부풀었고 018 이 대체해야 했다. ② 같은 문서가 어휘만 바뀐 채 반복된다. 둘 다 소유자가 2026-08-12 에 직접 지목했고, 각각 violations.tooLong 과 violations.skeletonMonotony·duplicate 로 눈금에 박혔다. 산문으로만 적어두면 루프가 다시 저지른다.",
    "forbidden_areas": "src/ 전체(트랙 B 소유), 기존 21개 배치 디렉터리, curriculum-v2.json 의 레벨 정의와 minimumAccepted, guidedSyntax 게이트, main 브랜치, .claude/loop/.sealed 와 .nonce",
    "deadline_budget": "2026-08-12 밤 5시간. 토큰은 이 트랙에 집중한다(소유자 지시). 미달로 끝나도 배치 단위로 커밋되어 다음 밤이 이어받는다.",
    "escalation": "없음 — 아침까지 기다린다. 소유자는 자고 있고 알림을 원하지 않는다. 중단 조건에 걸리면 상태를 보존하고 .claude/loop/MORNING.md 에 사유와 재진입 지점을 적는다."
  },
  "seal_extra": [
    ".claude/loop/baseline-batches.json",
    "scripts/loop/render-fresh.mjs",
    "scripts/loop/calibrate.mjs"
  ],
  "run": {
    "branch": "loop/problem-bank-512",
    "started_at_epoch": 1786465422,
    "note": "주행 시작 시 started_at_epoch 을 실제 시작 시각으로 갱신한다. verify 는 커밋 타임스탬프로 경과를 실측한다."
  },
  "seal": {
    "files": [
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": "scripts/loop/bank-gauges.mjs",
        "sha256": "fc863c149d8f7256ee13939000a5aac3f9c3c1e993139cb677bdae59a1d69840"
      },
      {
        "path": ".claude/loop/problem-bank-512.judge.md",
        "sha256": "609d82cf8f568a492cbd73d2eb4f5435dda244def4f116840bd4cddb3665355f"
      },
      {
        "path": ".claude/loop/baseline-batches.json",
        "sha256": "e07b0d3080d1f8e3112e7e502959d9fdb9991cbfb3e5ba32e22557aa290a85b0"
      },
      {
        "path": "scripts/loop/render-fresh.mjs",
        "sha256": "dc62c2690ffb8e29413adc6892f53f4a0ef8beb8da254efb4e711f02667dea46"
      },
      {
        "path": "scripts/loop/calibrate.mjs",
        "sha256": "dc4ce46fa2816d71b9da4f9b34fa5a8461cc471dbd5d757c53328c4df78e5426"
      }
    ],
    "nonce_sha256": "d15efa4b0d2008c89b13df7108664a803a722afd9d74df63761a22326636af7f"
  }
}
```

## 7. 주행 중 소유자 개입

`.claude/loop/NOTES.md` 를 매 회차 시작에 읽는다. 거기 적힌 한 줄이 이 파일보다 우선한다.
