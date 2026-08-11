#!/usr/bin/env node
// 연출대 — 이번 루프가 새로 만든 문제를 "학습자가 마주하는 형태"로 굳힌다.
//
// 심판은 이 출력만 본다. 빌더가 쓴 JSON 레코드·픽스처·리뷰 문서는 보지 않는다.
// 같은 관점을 두 번 보면 교차검증이 아니다.
//
//   node scripts/loop/render-fresh.mjs [--level 4] > .claude/loop/rounds/N/fresh.md

import { readFileSync, existsSync } from "node:fs";

const PROJECTIONS = "curriculum/problem-bank/runtime-projections.generated.json";
const BASELINE = ".claude/loop/baseline-batches.json";

const argv = process.argv.slice(2);
const levelArg = argv.includes("--level") ? Number(argv[argv.indexOf("--level") + 1]) : null;

if (!existsSync(BASELINE)) {
  console.error(`baseline 없음: ${BASELINE} — preflight 전에 만들어져 있어야 한다`);
  process.exit(1);
}
const baselineBatches = new Set(JSON.parse(readFileSync(BASELINE, "utf8")).batches);
const projections = JSON.parse(readFileSync(PROJECTIONS, "utf8"));

const fresh = [];
for (const [level, arr] of Object.entries(projections.levels)) {
  for (const p of arr) {
    if (baselineBatches.has(p.sourceBatchId)) continue;
    if (levelArg && Number(level) !== levelArg) continue;
    fresh.push({ ...p, level: Number(level) });
  }
}

fresh.sort((a, b) => a.level - b.level || String(a.id).localeCompare(String(b.id)));

const lines = [];
lines.push("# 이번 주행이 새로 만든 문제 — 학습자 시점");
lines.push("");
lines.push(
  `총 ${fresh.length}문제. 각 항목은 학습자가 화면에서 보는 순서 그대로다: 지시문 → 가르치는 내용 → 힌트 → 학습자가 만들어내야 하는 문서.`,
);
lines.push("");

if (!fresh.length) {
  lines.push("_아직 새 문제가 없다._");
}

for (const p of fresh) {
  lines.push(`---`);
  lines.push("");
  lines.push(`## L${p.level} · ${p.title ?? p.id}`);
  lines.push("");
  lines.push(`- 계열: \`${p.familyId ?? "?"}\` · 배치: \`${p.sourceBatchId}\` · id: \`${p.id}\``);
  lines.push(`- 길이: ${(p.target ?? "").length}자 · ${(p.target ?? "").split("\n").length}줄`);
  lines.push("");
  lines.push(`**화면의 지시문**`);
  lines.push("");
  lines.push(`> ${p.prompt ?? "(없음)"}`);
  lines.push("");
  if (p.teaching) {
    lines.push(`**가르치는 내용**`);
    lines.push("");
    lines.push(`- 개념: ${p.teaching.concept ?? ""}`);
    lines.push(`- 방법: ${p.teaching.howTo ?? ""}`);
    lines.push(`- 예시: \`${p.teaching.example ?? ""}\``);
    lines.push("");
  }
  if (Array.isArray(p.hints) && p.hints.length) {
    lines.push(`**힌트**`);
    lines.push("");
    for (const h of p.hints) lines.push(`1. ${h}`);
    lines.push("");
  }
  if (p.starterText) {
    lines.push(`**에디터에 미리 채워진 글자**`);
    lines.push("");
    lines.push("```text");
    lines.push(p.starterText);
    lines.push("```");
    lines.push("");
  }
  lines.push(`**학습자가 완성해야 하는 문서 (원본 마크다운)**`);
  lines.push("");
  lines.push("```markdown");
  lines.push(p.target ?? "");
  lines.push("```");
  lines.push("");
  lines.push(`**그 문서가 렌더된 모습**`);
  lines.push("");
  lines.push(p.target ?? "");
  lines.push("");
}

process.stdout.write(lines.join("\n") + "\n");
