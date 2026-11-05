/*
 * 척도 자동 채점 — 「첫방문_척도_채점입력안내_v0.1」(2026-11-04)의 규칙
 * 입력은 문항별 원응답(종이 설문지에서 체크한 칸의 번호)이고, 빈칸은 결측입니다.
 * 한 하위척도·총점에 결측 문항이 하나라도 있으면 그 점수는 비워 둡니다(원응답으로 나중에 다시 계산 가능).
 *
 *   스마트폰 과의존(유아동 관찰자용): sod_1…sod_9 = 1~4, 1~3번 역채점
 *   CSHQ: cshq_1…cshq_45 = 3 보통 / 2 가끔 / 1 거의 그렇지 않다, cshq_46…cshq_52 = 1 졸리지 않음 / 2 매우 졸려 보임 / 3 잠이 듦
 *   NQ-C 개정판(식약처 식품안전나라 게시, 19문항·균형 7·절제 7·실천 5): nq_1…nq_19 = 선택지 번호(①=1 … ⑤=5)
 *     공식 가중치·등급 기준을 아직 받지 못해 점수는 비워 둡니다(NQ_WEIGHTS_READY = false). 원응답은 그대로 저장됩니다.
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

/* ---------- NQ-C 개정판 (19문항) ---------- */
// g: 영역(문항 순서·문항 수 7/7/5로 추정한 배정 — 공식 자료로 확인 필요), max: 선택지 수
// rev: 높은 번호가 나쁜 식행동인 문항(추정). C(영역 내 가중치)·D(NQ 가중치)는 공식 자료를 받으면 채움.
const NQ_WEIGHTS_READY = false;
const NQ = {};
for (let k = 1; k <= 19; k++) NQ[k] = { g: k <= 7 ? 'bal' : k <= 14 ? 'mod' : 'pra', max: 5, rev: k >= 8 && k <= 14, C: null, D: null };
const NQ_GRADE = [];   // 공식 등급 기준을 받으면 [[하한, '상'], …] 형식으로 채움
function nqItemScore(k, v) {
  const it = NQ[k];
  if (!it || v === null || v < 1 || v > it.max) return null;
  const P = it.rev ? it.max + 1 - v : v;
  return (P - 1) * 100 / (it.max - 1);
}

const COLUMNS = [
  'sod_ctrl', 'sod_sal', 'sod_cons', 'sod_total', 'sod_group',
  'cshq_br', 'cshq_sol', 'cshq_dur', 'cshq_anx', 'cshq_nw', 'cshq_para', 'cshq_sdb', 'cshq_ds',
  'cshq_total', 'cshq_total_alt', 'cshq_n_missing',
  'nq_bal', 'nq_mod', 'nq_pra', 'nq_total', 'nq_grade', 'nq_n_missing',
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
  // NQ-C 개정판: 가중치가 없으면 결측 수만 계산
  let miss = 0;
  for (const k of Object.keys(NQ)) if (nqItemScore(k, num(row['nq_' + k])) === null) miss++;
  out.nq_n_missing = miss;
  if (!NQ_WEIGHTS_READY) { ['nq_bal', 'nq_mod', 'nq_pra', 'nq_total', 'nq_grade'].forEach(c => { out[c] = ''; }); }
  else {
    const groups = { bal: 0, mod: 0, pra: 0 }, bad = {}; let total = 0;
    for (const k of Object.keys(NQ)) {
      const it = NQ[k], B = nqItemScore(k, num(row['nq_' + k]));
      if (B === null) { bad[it.g] = true; continue; }
      groups[it.g] += B * it.C; total += B * it.D;
    }
    for (const g of Object.keys(groups)) out['nq_' + g] = bad[g] ? '' : r2(groups[g]);
    out.nq_total = miss ? '' : r2(total);
    const gr = NQ_GRADE.find(([cut]) => r2(total) >= cut);
    out.nq_grade = miss || !gr ? '' : gr[1];
  }
  return out;
}

const api = { compute, COLUMNS, CSHQ_SUB, CSHQ_REV, CSHQ_TOTAL, NQ, NQ_WEIGHTS_READY, nqItemScore };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.SURVEY_SCORING = api;
})(typeof window !== 'undefined' ? window : globalThis);
