/*
 * 척도 자동 채점 — 「첫방문_척도_채점입력안내_v0.1」(2026-11-04)의 규칙
 * 입력은 문항별 원응답(종이 설문지에서 체크한 칸의 번호)이고, 빈칸은 결측입니다.
 * 한 하위척도·총점에 결측 문항이 하나라도 있으면 그 점수는 비워 둡니다(원응답으로 나중에 다시 계산 가능).
 *
 *   스마트폰 과의존(유아동 관찰자용): sod_1…sod_9 = 1~4, 1~3번 역채점
 *   CSHQ: cshq_1…cshq_45 = 3 보통 / 2 가끔 / 1 거의 그렇지 않다, cshq_46…cshq_52 = 1 졸리지 않음 / 2 매우 졸려 보임 / 3 잠이 듦
 *   NQ-C(2020): nq_1…nq_20 = 선택지 번호(①=1 …), 응답 점수 변환·가중치는 이정숙 외 2020 Table 4
 */
(function (root) {
'use strict';

const num = v => (v === undefined || v === null || v === '' ? null : Number(v));
const sumOf = (row, cols, f = x => x) => {
  let s = 0;
  for (const c of cols) { const v = num(row[c]); if (v === null || Number.isNaN(v)) return null; s += f(v, c); }
  return s;
};
const r2 = x => (x === null ? '' : Math.round(x * 100) / 100);

/* ---------- 스마트폰 과의존 ---------- */
const SOD_REV = [1, 2, 3];
const sodItem = (v, c) => (SOD_REV.includes(Number(c.split('_')[1])) ? 5 - v : v);
const SOD = { ctrl: [1, 2, 3], sal: [4, 5, 6], cons: [7, 8, 9] };

/* ---------- CSHQ (Owens 2000 Table 1, 한국어판 1~52번) ---------- */
const CSHQ_REV = [1, 2, 3, 15, 16, 35];
const CSHQ_SUB = {
  br: [1, 3, 4, 7, 10, 12],                   // 입면 저항
  sol: [2],                                   // 입면 지연
  dur: [13, 15, 16],                          // 수면량
  anx: [7, 11, 12, 27],                       // 수면 불안
  nw: [21, 31, 32],                           // 입면 후 각성
  para: [17, 18, 19, 20, 23, 29, 30],         // 사건수면
  sdb: [24, 25, 26],                          // 수면 호흡 장애
  ds: [35, 37, 38, 39, 40, 45, 49, 50],       // 주간 졸림 (49 TV, 50 차)
};
const CSHQ_TOTAL = [...new Set(Object.values(CSHQ_SUB).flat())].sort((a, b) => a - b);   // 33문항
const cshqItem = (v, c) => (CSHQ_REV.includes(Number(c.split('_')[1])) ? 4 - v : v);

/* ---------- NQ-C 2020 ---------- */
// rev: 응답 점수 P = (선택지 수 + 1) − 선택 번호 / max: 선택지 수 / C: 영역 내 가중치 / D: NQ 가중치
const NQ = {
  1: { g: 'div', max: 5, C: 0.355, D: 0.053 },
  2: { g: 'bal', max: 5, C: 0.139, D: 0.035 },
  3: { g: 'bal', max: 5, C: 0.140, D: 0.035 },
  4: { g: 'bal', max: 6, C: 0.212, D: 0.053 },
  5: { g: 'bal', max: 6, C: 0.262, D: 0.066 },
  6: { g: 'bal', max: 6, C: 0.247, D: 0.062 },
  7: { g: 'mod', max: 6, rev: true, C: 0.179, D: 0.045 },
  8: { g: 'mod', max: 6, rev: true, C: 0.177, D: 0.044 },
  9: { g: 'mod', max: 5, rev: true, C: 0.163, D: 0.041 },
  10: { g: 'mod', max: 6, rev: true, C: 0.185, D: 0.046 },
  11: { g: 'mod', max: 6, rev: true, C: 0.136, D: 0.034 },
  12: { g: 'env', max: 5, C: 0.011, D: 0.002 },
  13: { g: 'env', max: 5, C: 0.712, D: 0.107 },
  14: { g: 'env', max: 5, C: 0.277, D: 0.042 },
  15: { g: 'div', max: 5, C: 0.465, D: 0.070 },
  16: { g: 'div', max: 5, rev: true, C: 0.180, D: 0.027 },
  17: { g: 'mod', max: 5, rev: true, C: 0.159, D: 0.040 },
  18: { g: 'pra', max: 5, C: 0.235, D: 0.047 },
  19: { g: 'pra', max: 5, C: 0.419, D: 0.084 },
  20: { g: 'pra', max: 5, C: 0.346, D: 0.069 },
};
const NQ_GRADE = [[72.4, '상'], [65.8, '중상'], [59.2, '중하'], [0, '하']];   // Table 5 (NQ-C 총점)
function nqItemScore(k, v) {
  const it = NQ[k];
  if (v === null || v < 1 || v > it.max) return null;
  const P = it.rev ? it.max + 1 - v : v;
  return (P - 1) * 100 / (it.max - 1);
}

const COLUMNS = [
  'sod_ctrl', 'sod_sal', 'sod_cons', 'sod_total', 'sod_group',
  'cshq_br', 'cshq_sol', 'cshq_dur', 'cshq_anx', 'cshq_nw', 'cshq_para', 'cshq_sdb', 'cshq_ds',
  'cshq_total', 'cshq_total_alt', 'cshq_n_missing',
  'nq_bal', 'nq_div', 'nq_mod', 'nq_pra', 'nq_env', 'nq_total', 'nq_grade', 'nq_n_missing',
];

function compute(row) {
  const out = {};
  // 스마트폰: sod_use = 0(사용 안 함)이면 해당 없음
  if (String(row.sod_use) === '0') {
    COLUMNS.filter(c => c.startsWith('sod_')).forEach(c => { out[c] = 'NA'; });
  } else {
    for (const [k, items] of Object.entries(SOD)) { const s = sumOf(row, items.map(i => 'sod_' + i), sodItem); out['sod_' + k] = s ?? ''; }
    const t = sumOf(row, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => 'sod_' + i), sodItem);
    out.sod_total = t ?? '';
    out.sod_group = t === null ? '' : t >= 28 ? '고위험' : t >= 24 ? '잠재적 위험' : '일반';
  }
  // CSHQ
  for (const [k, items] of Object.entries(CSHQ_SUB)) { const s = sumOf(row, items.map(i => 'cshq_' + i), cshqItem); out['cshq_' + k] = s ?? ''; }
  const tc = CSHQ_TOTAL.map(i => 'cshq_' + i);
  const ct = sumOf(row, tc, cshqItem);
  out.cshq_total = ct ?? '';
  out.cshq_total_alt = ct === null ? '' : ct - 2;           // 49·50번을 0~2로 코딩한 방식
  out.cshq_n_missing = tc.filter(c => num(row[c]) === null).length;
  // NQ-C
  const groups = { bal: 0, div: 0, mod: 0, pra: 0, env: 0 }, bad = {};
  let total = 0, miss = 0;
  for (const k of Object.keys(NQ)) {
    const it = NQ[k], B = nqItemScore(k, num(row['nq_' + k]));
    if (B === null) { miss++; bad[it.g] = true; continue; }
    groups[it.g] += B * it.C; total += B * it.D;
  }
  for (const g of Object.keys(groups)) out['nq_' + g] = bad[g] ? '' : r2(groups[g]);
  out.nq_total = miss ? '' : r2(total);
  out.nq_grade = miss ? '' : NQ_GRADE.find(([cut]) => r2(total) >= cut)[1];
  out.nq_n_missing = miss;
  return out;
}

const api = { compute, COLUMNS, CSHQ_SUB, CSHQ_REV, CSHQ_TOTAL, NQ, nqItemScore };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.SURVEY_SCORING = api;
})(typeof window !== 'undefined' ? window : globalThis);
