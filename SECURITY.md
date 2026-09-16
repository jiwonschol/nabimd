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
