# 출시 점검 — 새 Level 1 (계획서 §6 G4)

2026-11-04에 이 저장소의 운영 빌드로 쟀다. 커밋 `c82c457`(main `c1b843c` 위에 운영 점검 스펙과 런북만 더한 것)을 `NABI_BUILD_SHA=$(git rev-parse HEAD) npm run build:cloudflare`로 빌드하고, `NABI_BASE_PATH=/nabimd/ npx vite preview --port 4392`로 실제 주소와 같은 `/nabimd/` 아래에 띄웠다. 측정 기계는 macOS 27.2(Apple Silicon)이고 브라우저는 Playwright 1.63의 Chromium(Chrome for Testing, `chromium-1243`)이다. 네트워크가 로컬이라 실제 배포보다 빠르게 나온다. 그래서 Lighthouse 성능은 Lighthouse가 기본으로 흉내 내는 모바일 회선·CPU 감속 값으로 본다.

## 한눈에

| 게이트 | 기준 | 잰 값 | 판정 |
|---|---|---|---|
| axe critical | 0 | 0 (다른 등급까지 모두 0) | 통과 |
| Lighthouse 모바일 성능 | 85 이상 | 99 ~ 100 | 통과 |
| Lighthouse 모바일 접근성 | 95 이상 | 100 | 통과 |
| 초기 JS | 800 KB(raw) 이하 | 753,570 B (gzip 233,874 B) | 통과 |
| 문제은행 언어별 지연 청크 | 언어마다 따로, 자기 것만 받는다 | 한국어 50,479 B · 영어 930,256 B, 다른 언어 것은 받지 않음 | 통과 |

## Lighthouse 13.6.0 (모바일)

명령: `CHROME_PATH=<Chrome for Testing 경로> npx -y lighthouse@13.6.0 <주소> --form-factor=mobile --chrome-flags="--headless=new"`. 한국어 줄은 `--lang=ko-KR`을 더했다. 이 앱은 저장된 언어가 없으면 브라우저 언어와 상관없이 한국어로 열려서, 두 경우 모두 한국어 화면이고 한국어 문제은행 청크만 받았다.

| 주소 | 브라우저 언어 | 성능 | 접근성 | 권장 사항 | 검색 | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/nabimd/` (홈) | en-US | 99 | 100 | 100 | 100 | 0.8 s | 100 ms | 0 |
| `/nabimd/practice?mark=heading` | en-US | 99 | 100 | 100 | 100 | 0.8 s | 120 ms | 0 |
| `/nabimd/` (홈) | ko-KR | 99 | 100 | 100 | 100 | 0.8 s | 100 ms | 0 |
| `/nabimd/practice?mark=heading` | ko-KR | 100 | 100 | 100 | 100 | 0.8 s | 90 ms | 0 |

영어 화면은 Lighthouse로 재지 못했다. 영어는 `localStorage`의 `onsoon-lang`에 `en`이 있어야 열리는데, Lighthouse 명령줄은 첫 요청 전에 저장소를 채울 수 없다. 영어 화면의 차이는 문제은행 청크 하나(아래 표)이고, 그 청크는 첫 화면을 그린 뒤 받는다.

## axe (`@axe-core/playwright`, 규칙 `wcag2a`·`wcag2aa`)

운영 빌드에서 한국어·영어 × 밝은·어두운 테마 × 1280·390폭 × 홈·연습(표 문서) = 24화면을 검사했다. 모든 화면에서 위반이 0건이다(critical만이 아니라 serious·moderate·minor도 0). 같은 화면들에서 가로 스크롤도 0px이었다.

e2e도 axe를 함께 돈다(`tests/e2e/redesign.spec.ts`). 첫 방문 홈, 틀린 뒤와 통과한 뒤의 연습 화면, 요약, 그리고 한국어 기호 12개 각각의 문서를 통과 전과 후에 검사하고, 모두 critical 0이다.

## 번들 (`dist/assets`)

| 파일 | 언제 받나 | raw | gzip -9 |
|---|---|---|---|
| `index-*.js` | 모든 첫 화면 | 753,570 B | 233,874 B |
| `bankKo-*.js` | 한국어 화면에서 첫 화면 뒤 | 50,479 B | 16,804 B |
| `bankEn-*.js` | 영어 화면에서 첫 화면 뒤 | 930,256 B | 74,623 B |
| `index-*.css` | 모든 첫 화면 | 21,251 B | 4,708 B |

어느 청크를 받는지는 Playwright로 응답을 모아 확인했다. 한국어 화면은 `index`와 `bankKo`만, 영어 화면은 `index`와 `bankEn`만 받았다(위 24화면을 연 8개 브라우저 문맥 모두).

초기 JS 기준은 진입 청크(`index-*.js`) 하나로 쟀다. 게이트가 문제은행을 따로 "언어별 지연 청크"로 두기 때문이다. 한국어 첫 방문에서 진입 청크와 한국어 청크를 더하면 804,049 B로 800 KB를 조금 넘는다. 이 합을 기준으로 삼아야 한다면 이 줄은 미달이다.

Sentry가 켜진 빌드라면 이 크기가 달라질 수 있다. 오류 보고 SDK는 `VITE_SENTRY_DSN`이 빌드 때 주어질 때만 번들에 들어가는데(없으면 그 경로가 죽은 코드로 빠진다), 이 측정은 주지 않고 빌드했다. 지금 라이브 빌드(`dab0e3a`)에도 SDK가 들어 있지 않다. 그 번들에 `sentry` 문자열이 한 번도 나오지 않는다. 배포 명령도 이 값을 따로 넣지 않는다.

## e2e

| 스펙 | 대상 | 결과 |
|---|---|---|
| `tests/e2e/redesign.spec.ts` (G2 8 시나리오 + 영어 20장 + 기호 12개 axe) | 개발 서버 | 10개 통과 |
| `tests/e2e/production-health.spec.ts` (빌드 SHA, 한국어 지도 → 오늘의 다섯 장 → 요약, 영어 한 장) | 개발 서버 | 2개 통과, SHA 검사는 `EXPECTED_SHA`가 없어 건너뜀 |
| 같은 운영 점검 스펙 | 위 운영 빌드(`/nabimd/`, `EXPECTED_SHA=c82c457…`) | 3개 통과 |

## 사람이 확인해야 하는 것

자동화로는 증명되지 않아 완료로 치지 않는다(계획서 §7).

- iPhone Safari 한국어 자판에서 에디터의 한글 조합 입력, ⌘↩로 확인하기.
- Android Chrome에서 같은 두 가지.
- 효과음(iOS 무음 스위치를 켠 상태와 끈 상태).
- 어두운 테마의 실제 화면 색(axe 대비 검사는 통과했다).
- 휴대폰 자판이 올라온 상태에서 판정 바의 위치.

## 배포 뒤 확인 (2026-11-04)

PR #263(출시 준비)과 #264(배포 전 수정: 에디터 글꼴의 `|`, 지시문의 문서 유형)를 머지한 main `1c846d5`를 배포했다. 배포 명령(`npm run deploy:cloudflare`)은 Jiwon이 직접 실행했다. 이 세션의 권한 검사가 운영 배포를 막았기 때문이다. 배포 전 기록한 직전 Worker 버전은 `771b0bc5-361d-47ef-b02d-b4195220ef7a`(2026-10-04)다. 되돌릴 때 이 버전을 쓴다.

| 확인 | 결과 | 누가·어떻게 |
|---|---|---|
| 라이브 빌드 | `X-Nabi-Build-Sha: 1c846d5955447d1e07681ff81666f67e2e809ce7` | 출시 세션이 `curl -I`로 |
| 원격 D1 마이그레이션 | 적용할 것 없음 | 출시 세션이 배포 전에 `wrangler d1 migrations list NABIMD_DB --remote`로 |
| production-health (workflow_dispatch, `expected_sha=1c846d5…`) | 성공, 3개 통과 — run 41792710818 | 지휘 세션이 실행, 출시 세션이 `gh run view`로 결과 확인 |
| 라이브 한국어 한 장 | 표 문서 '주간 식단' 통과, 지시문 "이 식단표를 마크다운으로 쓴다." | 지휘 세션, 출시 세션(Playwright) 둘 다 |
| 라이브 `\|` 모양 | 에디터에서 끊기지 않은 막대 | 지휘 세션(브라우저), 출시 세션(라이브 캡처) |
| 라이브 영어 한 장 | 굵게 문서 `l1-emphasis-safety-first` 통과, "Passed — you wrote the Bold mark correctly." | 지휘 세션, 출시 세션(Playwright) 둘 다 |
| 동의 전 통계 요청 | 0건 | 지휘 세션, 출시 세션 둘 다 |
| "모두 동의" 뒤 통계 | `beacon.min.js` 요청 1건 | 출시 세션(요청을 가로채 실제로는 보내지 않음) |
| 통계 집계 요청 | `cloudflareinsights.com/cdn-cgi/rum` 204 | 지휘 세션(브라우저) |
| 진도 저장 | `localStorage`의 `nabimd.learning.v1`에 남음(영어 `bold` 기록 확인) | 지휘 세션, 출시 세션 둘 다 |
| 콘솔 오류 | 0 (출시 세션의 라이브 확인 동안) | 출시 세션 |

### 아직 확인하지 못한 것

- **사람 확인 필요(실기기):** iPhone Safari와 Android Chrome 한국어 자판의 한글 조합 입력과 ⌘↩, 효과음(iOS 무음 스위치), 어두운 테마의 실제 색, 휴대폰 자판이 올라온 상태에서 판정 바의 위치.
- **배포 24시간 뒤 Sentry 신규 오류 0:** 확인할 수 없다. 운영 빌드에 `VITE_SENTRY_DSN`이 주어지지 않아 오류 보고 SDK가 번들에 들어 있지 않다(위 '번들' 절).
- **통계 숫자:** 4주 뒤 Cloudflare Web Analytics에서 방문, `/practice`·`/done` 도달 비율, 국가, 유입 경로를 Jiwon이 읽는다.
