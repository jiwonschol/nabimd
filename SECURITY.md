# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.
Report privately via GitHub:
https://github.com/jiwonschol/nabimd/security/advisories/new

If you cannot use that form, email **security@overwater.app**.

## What to expect

This is a solo-maintained project, so I can't promise a fixed response
window — but every report is read, acknowledged, and followed up until it
is resolved. I'm happy to credit you in the fix if you'd like.

## Scope

Nabi Markdown runs learning exercises in your browser, without accounts or
client analytics. Learning progress and draft answers stay in browser session
storage, with an in-memory fallback when that storage is unavailable.

Builds configured with `VITE_SENTRY_DSN` send filtered browser error reports to
Sentry. This includes uncaught errors and rejected promises, React render
failures, and grading failures. Reports may contain the build revision,
exception type, allowed error messages, stack locations, and problem/boundary
tags. The app filters out draft bodies, request and user objects, interaction
breadcrumbs, and arbitrary extra data;
it does not enable session replay or performance tracing. This filtering is
not a guarantee that every error field is free of personal information.
SDK diagnostic metadata and discarded-event counts may also be sent. Sentry
retention and network/infrastructure handling are separate from the Summary
feedback policy below. See [monitoring details](docs/production-health-monitoring.md#client-error-reporting)
for the activation condition, filters, and limits of this notice.

Optional Summary notes are sent to a Cloudflare Worker API and stored in D1.
Each feedback row contains a submission ID, the note, level, score, total number
of questions, app revision, and creation and expiry timestamps. Feedback
requests do not send exercise answers or account details. Notes are free text
and may contain information supplied by the sender; please do not include
sensitive personal information.

The feedback retention policy is at most 90 days. Rows expire after 89 days and
a daily cleanup deletes expired rows. Meeting the policy depends on that job
running successfully; expiry alone does not delete a row. IP addresses are
used for submission rate limiting but are not stored in feedback rows. This
statement describes application feedback storage, not all infrastructure logs.

The most valuable reports are:

- Script injection through Markdown rendering
- Feedback API abuse, unintended data disclosure, or retention/deletion failures
- Vulnerable or compromised dependencies (npm supply chain)
- Build/deploy pipeline issues

---

## 한국어 안내

보안 문제는 공개 이슈에 쓰지 말고 위 GitHub 비공개 신고 양식(또는
security@overwater.app)으로 알려주세요. 1인 유지보수 프로젝트라 확인까지
시간이 걸릴 수 있지만, 접수된 신고는 반드시 읽고 해결까지 진행 상황을
공유합니다.

학습은 계정과 클라이언트 분석 도구 없이 브라우저에서 실행됩니다. 학습 진행과
작성 중인 답안은 브라우저 세션 저장소에 남으며, 저장소를 사용할 수 없으면
메모리에만 유지됩니다.

`VITE_SENTRY_DSN`을 설정한 빌드는 필터링한 브라우저 오류 보고를 Sentry로
보냅니다. 처리되지 않은 오류와 Promise 거부, React 렌더링 실패, 채점 실패가
대상입니다. 보고에는 빌드 리비전, 예외 유형, 허용된 오류 메시지, 스택 위치,
문제·오류 경계 태그가 포함될 수 있습니다. 앱은 답안 본문, 요청·사용자 객체,
상호작용 기록과 임의의 추가 데이터를 걸러내며, 세션 녹화나
성능 추적은 켜지 않습니다. 이 필터가 모든 오류 필드에 개인정보가 없음을
보장하지는 않습니다. SDK 진단 메타데이터와 폐기된 이벤트 집계도 전송될 수
있습니다. Sentry 보관 기간과 네트워크·인프라 처리는 아래 소감 보관 정책과
별개입니다. 활성 조건, 필터와 고지의 한계는
[모니터링 문서](docs/production-health-monitoring.md#client-error-reporting)를 참고하세요.

Summary에서 선택적으로 보내는 소감은 Cloudflare Worker API를 통해 D1에
저장됩니다. 소감 행에는 전송 ID, 소감 내용, 레벨, 점수, 총 문항 수, 앱 리비전,
생성·만료 시각이 들어갑니다. 피드백 요청은 학습 답안이나 계정 정보를 보내지
않습니다. 소감은 자유 입력이므로 작성자가 개인정보를 포함할 수 있습니다.
민감한 개인정보는 적지 마세요.

소감 보관 정책은 최대 90일입니다. 생성 후 89일에 만료되며 일일 정리 작업이
만료 행을 삭제합니다. 정책을 지키려면 정리 작업이 정상 실행되어야 하며,
만료 시각이 지났다는 사실만으로 행이 삭제되지는 않습니다. IP 주소는 과다 전송
제한에 사용하지만 소감 행에는 저장하지 않습니다. 이는 애플리케이션의 소감
저장 범위에 대한 설명이며 모든 인프라 로그에 대한 보장은 아닙니다.

Markdown 렌더링 스크립트 주입, 피드백 API 악용·의도치 않은 정보 노출·보관 및
삭제 실패, 의존성 공급망과 빌드·배포 경로의 보안 문제를 신고해 주세요.
