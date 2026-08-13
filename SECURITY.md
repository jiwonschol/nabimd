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

Nabi Markdown is a fully static, client-side web app: no server, no API, no
accounts, no analytics, and no personal data collection (progress lives in
your browser's session storage only). The most valuable reports are:

- Script injection through Markdown rendering
- Vulnerable or compromised dependencies (npm supply chain)
- Build/deploy pipeline issues

---

## 한국어 안내

보안 문제는 공개 이슈에 쓰지 말고 위 GitHub 비공개 신고 양식(또는
security@overwater.app)으로 알려주세요. 1인 유지보수 프로젝트라 확인까지
시간이 걸릴 수 있지만, 접수된 신고는 반드시 읽고 해결까지 진행 상황을
공유합니다. 이 앱은 서버·계정·개인정보 수집이 전혀 없는 정적 웹앱이므로,
렌더링 스크립트 주입·의존성 공급망 문제가 주된 신고 대상입니다.
