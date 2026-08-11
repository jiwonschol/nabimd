#!/usr/bin/env node
// 관문 A — 민감도. 결함을 주입한 은행을 계측기에 먹여 잡는지 증명한다.
//
// 계측기에 파일경로 우회 스위치를 만들지 않는다. 그건 주행 중 빌더가 쓸 수 있는
// 도주로다. 대신 git 추적 파일을 실제로 변조했다가 `git checkout` 으로 되돌린다.
//
// 각 주입은 "다른 눈금은 통과하는데 이 눈금만 잡는다"를 함께 단언한다. 그래야
// 눈금이 서로의 도주로를 막고 있다는 것이 기록으로 남는다.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PROJECTIONS = "curriculum/problem-bank/runtime-projections.generated.json";
const FAKE_BATCH = "9999-99-99-calibration-injection";

const read = () => JSON.parse(readFileSync(PROJECTIONS, "utf8"));
const write = (o) => writeFileSync(PROJECTIONS, JSON.stringify(o, null, 2) + "\n");
const restore = () => execFileSync("git", ["checkout", "--", PROJECTIONS]);
const gauge = (withGates = false) =>
  JSON.parse(
    execFileSync("node", ["scripts/loop/bank-gauges.mjs", ...(withGates ? [] : ["--skip-gates"])], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );

const problem = (level, target, id) => ({
  id,
  level,
  flavor: "standard",
  target,
  sourceBatchId: FAKE_BATCH,
  familyId: "calibration",
});

const injections = [
  {
    metric: "deficitTotal",
    defect: "L4 에 새 문제 48개 주입 — 도달 눈금이 실제로 움직이는가",
    apply(p) {
      for (let i = 0; i < 48; i++) {
        p.levels["4"].push(
          problem(4, `## Handoff ${i}\n\n- Owner: **Dana Ruiz**\n- Status: \`blocked on review\`\n`, `cal-l4-${i}`),
        );
      }
    },
    caught: (b, h) => b.deficitTotal === 172 && h.deficitTotal === 124,
  },
  {
    metric: "violations.tooLong",
    defect: "021 규격(196자)의 4.7배인 920자 L4 문제 — 017 이 저지른 것과 같은 결함",
    apply(p) {
      const bloat =
        "## Rollout plan\n\n" +
        "The team will coordinate the staged rollout across every affected surface. ".repeat(11) +
        "\n\n- Owner: **Dana Ruiz**\n";
      p.levels["4"].push(problem(4, bloat, "cal-l4-bloat"));
    },
    caught: (b, h) => b.violations.tooLong === 0 && h.violations.tooLong === 1,
  },
  {
    metric: "violations.tooSparse",
    defect: "길이 상한은 지키면서(233자) 마크는 2개뿐인 산문 덩어리 — 길이 눈금만으로는 통과한다",
    apply(p) {
      const prose =
        "# Notes\n\n" +
        "We reviewed the incident together and agreed that the on call rotation needs a clearer " +
        "handoff ritual so the next engineer knows what is still outstanding.";
      p.levels["5"].push(problem(5, prose, "cal-l5-prose"));
    },
    // 길이 위반은 0인데 밀도 위반만 1 — 두 눈금이 겹치지 않는다는 증거
    caught: (b, h) => b.violations.tooSparse === 0 && h.violations.tooSparse === 1 && h.violations.tooLong === 0,
  },
  {
    metric: "violations.markSpam",
    defect: "마크 스팸 — 68자에 밀도 0.265 로 하한을 넘지만 내용은 '# Alpha / # Beta' 나열",
    apply(p) {
      p.levels["5"].push(
        problem(5, "# Alpha\n# Beta\n# Gamma\n# Delta\n\n- one\n- two\n- three\n\n> note\n\n`code`\n", "cal-l5-spam"),
      );
    },
    // 길이·밀도 눈금은 통과시킨다 — 그래서 이 눈금이 따로 필요하다
    caught: (b, h) =>
      b.violations.markSpam === 0 &&
      h.violations.markSpam === 1 &&
      h.violations.tooLong === 0 &&
      h.violations.tooSparse === 0,
  },
  {
    metric: "violations.duplicate",
    defect: "기존 020 문제의 어휘만 바꾼 복제본 — 지원이 겪은 '같은 문서가 반복된다'",
    apply(p) {
      const original = p.levels["5"].find((x) => x.sourceBatchId === "2026-07-22-l5-developer-forms-020");
      p.levels["5"].push(
        problem(5, original.target.replace(/Dana/g, "Robin").replace(/staging/g, "preview"), "cal-l5-clone"),
      );
    },
    caught: (b, h) => b.violations.duplicate === 0 && h.violations.duplicate === 1,
  },
  {
    metric: "violations.skeletonMonotony",
    defect: "구조 판박이 — 어휘만 갈아끼운 동일 골격 문서 20개",
    apply(p) {
      const names =
        "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango".split(
          " ",
        );
      names.forEach((n, i) => {
        p.levels["3"].push(
          problem(
            3,
            `# Weekly ${n} report\n\nThe ${n} team shipped the ${n} update today.\n\n- Owner: **${n} lead**\n- Status: \`${n}-done\`\n`,
            `cal-l3-skel-${i}`,
          ),
        );
      });
    },
    // 트라이그램 중복도는 못 잡는다 — 그래서 골격 눈금이 따로 필요하다
    caught: (b, h) =>
      b.violations.skeletonMonotony === 0 && h.violations.skeletonMonotony === 1 && h.violations.duplicate === 0,
  },
  {
    metric: "baselineIntact",
    defect: "봉인된 기존 문제 1개의 본문을 조용히 수정 — 불변 자산 변조",
    apply(p) {
      p.levels["3"][0].target = p.levels["3"][0].target + "\n\ntampered";
    },
    caught: (b, h) => b.baselineIntact === true && h.baselineIntact === false,
  },
  {
    metric: "gatesPass",
    defect: "발행 산출물을 손으로 고쳐 저장소 게이트(재생성 대조)를 깨뜨린다",
    gates: true,
    apply(p) {
      p.levels["4"][0].target = p.levels["4"][0].target + "\n\n- injected line\n";
    },
    caught: (b, h) => b.gatesPass === 1 && h.gatesPass === 0,
  },
];

const baseNoGates = gauge(false);
const baseWithGates = gauge(true);
const results = [];

for (const inj of injections) {
  const doc = read();
  inj.apply(doc);
  write(doc);
  let hit;
  try {
    hit = gauge(inj.gates === true);
  } finally {
    restore();
  }
  const base = inj.gates ? baseWithGates : baseNoGates;
  results.push({
    metric: inj.metric,
    injection: inj.defect,
    caught: inj.caught(base, hit),
    observed: {
      deficitTotal: hit.deficitTotal,
      violations: hit.violations,
      baselineIntact: hit.baselineIntact,
      gatesPass: hit.gatesPass,
    },
  });
}

const after = gauge(false);
const restoredCleanly = JSON.stringify(after) === JSON.stringify(baseNoGates);

process.stdout.write(
  JSON.stringify(
    { baseline: baseWithGates, results, restoredCleanly, allCaught: results.every((r) => r.caught) },
    null,
    2,
  ) + "\n",
);
if (!restoredCleanly || !results.every((r) => r.caught)) process.exit(1);
