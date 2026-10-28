/*
 * 응답 → 시트 열 변환 규칙 (브라우저와 열 목록 생성 도구가 함께 씀)
 * 한 문항이 여러 칸이면 변수명 뒤에 접미사를 붙입니다.
 *   주중/주말 → _wd/_we, 아버지/어머니 → _father/_mother, 나이 → _y/_m,
 *   척도 → _1 … _n, 여러 개 + 세부 → 변수명(이름 목록) + _json, 운동 → _n(개수) + _json
 */
(function (root) {
'use strict';
const WD0 = '주중 (월–금)';
const SUF = { '아버지': 'father', '어머니': 'mother' };
const isWD = q => !q.labels || q.labels[0] === WD0;
const keysOf = q => isWD(q) ? [['wd', 'wd'], ['we', 'we']] : q.labels.map(l => [l, SUF[l] || l]);

function columnsOf(q) {
  if (q.secret || q.meta) return [];  // 연구 번호·방문 차수는 시트 앞쪽 고정 열에 들어감
  switch (q.t) {
    case 'calc': return [];
    case 'pairNum': case 'pairSingle': case 'pairClock': return keysOf(q).map(([, s]) => `${q.id}_${s}`);
    case 'age': return [`${q.id}_y`, `${q.id}_m`];
    case 'multiDetail': return [q.id, `${q.id}_json`];
    case 'sports': return [`${q.id}_n`, `${q.id}_json`];
    case 'scale': return Array.from({ length: q.n }, (_, i) => `${q.id}_${i + 1}`);
    default: return [q.id];
  }
}

function questionsFor(sections, form) {
  return sections.filter(s => s.forms.includes(form)).flatMap(s => s.qs.filter(q => !q.forms || q.forms.includes(form)));
}

function columnsFor(sections, form) {
  return questionsFor(sections, form).flatMap(columnsOf);
}

function flatten(sections, form, answers) {
  const row = {};
  questionsFor(sections, form).forEach(q => {
    const v = answers[q.id];
    if (v === undefined || q.secret || q.meta) return;
    const none = v === 'none';
    switch (q.t) {
      case 'calc': break;
      case 'pairNum': case 'pairSingle': case 'pairClock':
        keysOf(q).forEach(([k, s]) => { if (v && v[k] !== undefined && v[k] !== '') row[`${q.id}_${s}`] = v[k]; });
        break;
      case 'age': row[`${q.id}_y`] = v.y ?? ''; row[`${q.id}_m`] = v.m ?? ''; break;
      case 'multi': row[q.id] = none ? 'none' : [].concat(v).join('|'); break;
      case 'multiDetail':
        row[q.id] = none ? 'none' : v.map(x => x.name).join('|');
        if (!none) row[`${q.id}_json`] = JSON.stringify(v);
        break;
      case 'sports':
        row[`${q.id}_n`] = none ? 0 : v.length;
        if (!none) row[`${q.id}_json`] = JSON.stringify(v);
        break;
      case 'scale': Object.entries(v).forEach(([k, x]) => { row[`${q.id}_${k}`] = x; }); break;
      default: row[q.id] = String(v);
    }
  });
  return row;
}

const api = { columnsFor, flatten, columnsOf };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.SURVEY_FLATTEN = api;
})(typeof window !== 'undefined' ? window : globalThis);
