/* 보호자 설문 엔진 — 문항은 questions.js, 설정은 config.js에서 고칩니다. */
(function () {
'use strict';
const CFG = window.SURVEY_CONFIG;
const { SECTIONS, WD, SPORTS, INTENSITY } = window.SURVEY;
const FORM = document.body.dataset.form;               // 'baseline' | 'followup'
const URLP = new URLSearchParams(location.search);
const DEMO = CFG.MODE !== 'live' || URLP.get('debug') === '1';
const S = {};
const META = { started_at: new Date().toISOString() };
let cur = 0;
let phase = 'q';                                         // q | review | done

/* ---------- 작은 도구 ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, attrs = {}, kids = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach(c => c != null && e.append(c));
  return e;
};
const pick = v => (v && typeof v === 'object' && !Array.isArray(v) && (v.baseline || v.followup)) ? (v[FORM] ?? '') : v;
const store = {
  key: () => `gsurvey:${FORM}:${URLP.get('id') || 'local'}`,
  load() { if (!CFG.SAVE_DRAFT) return null; try { return JSON.parse(localStorage.getItem(this.key()) || 'null'); } catch (e) { return null; } },
  save() { if (!CFG.SAVE_DRAFT) return; try { localStorage.setItem(this.key(), JSON.stringify({ S, META, cur, saved_at: Date.now() })); } catch (e) {} },
  clear() { try { localStorage.removeItem(this.key()); } catch (e) {} },
};
let saveTimer = null;
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.save(), 400); };

/* ---------- 섹션·문항 ---------- */
function activeSections() {
  return SECTIONS.filter(sec => sec.forms.includes(FORM) &&
    (!sec.annual || FORM === 'baseline' || CFG.ANNUAL_VISITS.includes(S.visit_month)));
}
const qsOf = sec => sec.qs.filter(q => !q.forms || q.forms.includes(FORM));
const qVisible = q => !q.show || !!q.show(S, FORM);
function isAnswered(q) {
  const v = S[q.id];
  if (S[q.id + '_none']) return true;
  if (v === undefined || v === '' || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v).some(x => x !== '' && x != null);
  return true;
}
function counts() {
  let total = 0, done = 0; const missingCore = [];
  activeSections().forEach((sec, si) => qsOf(sec).forEach(q => {
    if (q.t === 'calc' || !qVisible(q)) return;
    total++;
    if (isAnswered(q)) done++; else if (q.p === '핵심') missingCore.push({ si, q });
  }));
  return { total, done, missingCore };
}

/* ---------- 위젯 ---------- */
function chips(options, isSel, onPick, { multi = false, none = null, suffix = '', name = '' } = {}) {
  const wrap = h('div', { class: 'chips' + (options.every(o => String(o).length <= 3) ? ' compact' : ''), role: multi ? 'group' : 'radiogroup', 'aria-label': name });
  (none ? [...options, none] : options).forEach(o => {
    const label = suffix && /^[0-9]+$/.test(o) ? o + suffix : o;
    const b = h('button', { type: 'button', class: 'chip' + (o === none ? ' none' : ''), 'aria-pressed': isSel(o) ? 'true' : 'false', text: label });
    b.addEventListener('click', () => onPick(o));
    wrap.append(b);
  });
  return wrap;
}
function numBox(id, q, getV, setV, label) {
  const inp = h('input', { type: 'number', inputmode: 'decimal', id, min: q.min, max: q.max, step: q.step || 1, placeholder: '입력', 'aria-label': label });
  const v = getV(); if (v !== undefined && v !== '모름') inp.value = v;
  inp.addEventListener('input', () => setV(inp.value));
  return h('label', { class: 'num' }, [inp, q.u ? h('span', { class: 'unit', text: q.u }) : null]);
}
function clockOptions(from, to) {
  const toMin = t => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  let a = toMin(from), b = toMin(to); if (b <= a) b += 1440;
  const out = [];
  for (let m = a; m <= b; m += CFG.TIME_STEP_MIN) {
    const mm = m % 1440, hh = Math.floor(mm / 60), mi = mm % 60;
    const v = `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    const ap = hh < 12 ? '오전' : '오후', h12 = hh % 12 === 0 ? 12 : hh % 12;
    out.push([v, `${ap} ${h12}:${String(mi).padStart(2, '0')}`]);
  }
  return out;
}
const guide = () => h('details', { class: 'guide' }, [
  h('summary', { text: '사용시간 확인하는 방법' }),
  h('p', {}, [h('b', { text: '아이폰·아이패드: ' }), document.createTextNode('설정 → 스크린 타임 → "모든 활동 보기" → 위에서 "주" 선택 → "일일 평균" 확인')]),
  h('p', {}, [h('b', { text: '안드로이드: ' }), document.createTextNode('설정 → 디지털 웰빙 및 자녀 보호 기능 → 대시보드 → 지난 7일의 하루 평균 확인')]),
  h('p', { class: 'muted', text: '메뉴 이름은 기기와 버전에 따라 조금 다를 수 있습니다.' }),
]);

function render(q) {
  const box = h('div', { class: 'q', 'data-id': q.id });
  if (q.t !== 'calc') {
    box.append(h('div', { class: 'qhead' }, [
      h('p', { class: 'qtext', text: pick(q.q) }),
      h('span', { class: 'meta' }, [h('code', { text: q.id }), h('span', { class: 'pri pri-' + q.p, text: q.p })]),
    ]));
    if (q.h) box.append(h('p', { class: 'help' + (q.h.startsWith('[연구진]') ? ' rs-only' : ''), text: q.h }));
  }
  const body = h('div', { class: 'qbody' });
  box.append(body);
  fill(q, body);
  return box;
}

function fill(q, body) {
  body.innerHTML = '';
  const id = q.id;
  const set = v => { S[id] = v; changed(); };
  const redraw = () => fill(q, body);
  switch (q.t) {
    case 'single':
      body.append(chips(q.o, o => S[id] === o, o => { set(S[id] === o ? undefined : o); redraw(); }, { suffix: q.suffix, name: pick(q.q) }));
      break;
    case 'multi': {
      const opts = q.oBy ? q.oBy(S) : q.o;
      const arr = () => (Array.isArray(S[id]) ? S[id] : []);
      body.append(chips(opts, o => arr().includes(o), o => {
        let v = arr();
        if (o === q.none) v = v.includes(o) ? [] : [o];
        else { v = v.filter(x => x !== q.none); v = v.includes(o) ? v.filter(x => x !== o) : [...v, o]; }
        set(v); redraw();
      }, { multi: true, none: q.none, name: pick(q.q) }));
      break;
    }
    case 'number': {
      const row = h('div', { class: 'row' });
      const n = numBox('in_' + id, q, () => S[id], v => set(v), pick(q.q));
      row.append(n);
      if (q.unknown) {
        const unk = h('button', { type: 'button', class: 'chip none', 'aria-pressed': S[id] === '모름' ? 'true' : 'false', text: '모름' });
        unk.addEventListener('click', () => { set(S[id] === '모름' ? undefined : '모름'); redraw(); });
        if (S[id] === '모름') n.querySelector('input').disabled = true;
        row.append(unk);
      }
      body.append(row);
      if (q.guide) body.append(guide());
      break;
    }
    case 'text': {
      const inp = h('input', { type: 'text', id: 'in_' + id, placeholder: q.ph || '', 'aria-label': pick(q.q), autocomplete: 'off' });
      if (S[id]) inp.value = S[id];
      inp.addEventListener('input', () => { S[id] = inp.value.trim(); changed(); });
      body.append(inp);
      break;
    }
    case 'pairNum': {
      const grid = h('div', { class: 'pair' });
      q.labels.forEach((lab, i) => {
        const k = q.labels === WD ? (i ? 'we' : 'wd') : lab;
        grid.append(h('div', { class: 'cell' }, [h('span', { class: 'lab', text: lab }),
          numBox(`in_${id}_${i}`, q, () => (S[id] || {})[k], val => { S[id] = { ...(S[id] || {}), [k]: val }; changed(); }, `${pick(q.q)} ${lab}`)]));
      });
      body.append(grid);
      if (q.guide) body.append(guide());
      break;
    }
    case 'pairSingle': {
      const stack = h('div', { class: 'stack' });
      q.labels.forEach((lab, i) => {
        const k = q.labels === WD ? (i ? 'we' : 'wd') : lab;
        const getV = () => (S[id] || {})[k];
        stack.append(h('div', { class: 'subq' }, [h('span', { class: 'lab', text: lab }),
          chips(q.o, o => getV() === o, o => { S[id] = { ...(S[id] || {}), [k]: getV() === o ? '' : o }; changed(); redraw(); }, { name: `${pick(q.q)} ${lab}` })]));
      });
      body.append(stack);
      break;
    }
    case 'pairClock': {
      const grid = h('div', { class: 'pair' });
      const opts = clockOptions(q.from, q.to);
      WD.forEach((lab, i) => {
        const k = i ? 'we' : 'wd';
        const sel = h('select', { id: `in_${id}_${k}`, 'aria-label': `${pick(q.q)} ${lab}` }, [h('option', { value: '', text: '시각 선택' }), ...opts.map(([v, t]) => h('option', { value: v, text: t }))]);
        sel.value = (S[id] || {})[k] || '';
        sel.addEventListener('change', () => { S[id] = { ...(S[id] || {}), [k]: sel.value }; changed(); });
        grid.append(h('label', { class: 'cell' }, [h('span', { class: 'lab', text: lab }), sel]));
      });
      body.append(grid);
      break;
    }
    case 'age': {
      const v = S[id] || {};
      const yr = h('select', { id: `in_${id}_y`, 'aria-label': '나이(세)' }, [h('option', { value: '', text: '세' }), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => h('option', { value: n, text: n + '세' }))]);
      const mo = h('select', { id: `in_${id}_m`, 'aria-label': '개월' }, [h('option', { value: '', text: '개월' }), ...Array.from({ length: 12 }, (_, n) => h('option', { value: n, text: n + '개월' }))]);
      yr.value = v.y ?? ''; mo.value = v.m ?? '';
      const upd = () => { S[id] = { y: yr.value, m: mo.value }; changed(); };
      yr.addEventListener('change', upd); mo.addEventListener('change', upd);
      body.append(h('div', { class: 'row' }, [yr, mo]));
      break;
    }
    case 'multiDetail': {
      const arr = () => (Array.isArray(S[id]) ? S[id] : []);
      body.append(chips(q.o, o => o === q.none ? !!S[id + '_none'] : arr().some(x => x.name === o), o => {
        if (o === q.none) { S[id] = []; S[id + '_none'] = !S[id + '_none']; }
        else { S[id + '_none'] = false; const a = arr(); S[id] = a.some(x => x.name === o) ? a.filter(x => x.name !== o) : [...a, { name: o, start: '', now: '' }]; }
        changed(); redraw();
      }, { multi: true, none: q.none, name: pick(q.q) }));
      arr().forEach((it, i) => {
        const age = h('input', { type: 'number', inputmode: 'decimal', min: 0, max: 10, step: 0.5, id: `in_${id}_${i}`, placeholder: '나이', 'aria-label': `${it.name} 시작 나이` });
        if (it.start) age.value = it.start;
        age.addEventListener('input', () => { it.start = age.value; changed(); });
        body.append(h('div', { class: 'detail' }, [h('p', { class: 'dname', text: it.name }),
          h('label', { class: 'num small' }, [h('span', { class: 'lab', text: '시작' }), age, h('span', { class: 'unit', text: '세부터' })]),
          chips(['지금도 먹음', '지금은 안 먹음'], o => it.now === o, o => { it.now = o; changed(); redraw(); }, { name: it.name })]));
      });
      break;
    }
    case 'sports': {
      const arr = Array.isArray(S[id]) ? S[id] : (S[id] = []);
      arr.forEach((row, i) => {
        const sp = h('select', { id: `in_${id}_${i}_s`, 'aria-label': '종목' }, [h('option', { value: '', text: '종목 선택' }), ...SPORTS.map(s => h('option', { value: s, text: s }))]);
        sp.value = row.sport || ''; sp.addEventListener('change', () => { row.sport = sp.value; changed(); });
        const fq = h('select', { id: `in_${id}_${i}_f`, 'aria-label': '주 횟수' }, [h('option', { value: '', text: '주 몇 회' }), ...[1, 2, 3, 4, 5, 6, 7].map(n => h('option', { value: n, text: `주 ${n}회` }))]);
        fq.value = row.freq || ''; fq.addEventListener('change', () => { row.freq = fq.value; changed(); });
        const mn = h('input', { type: 'number', inputmode: 'numeric', min: 5, max: 300, id: `in_${id}_${i}_m`, placeholder: '분', 'aria-label': '1회 시간(분)' });
        if (row.min) mn.value = row.min; mn.addEventListener('input', () => { row.min = mn.value; changed(); });
        const del = h('button', { type: 'button', class: 'link danger', text: '삭제' });
        del.addEventListener('click', () => { arr.splice(i, 1); changed(); redraw(); });
        body.append(h('div', { class: 'sport' }, [
          h('div', { class: 'sporthead' }, [h('span', { class: 'lab', text: `운동 ${i + 1}` }), del]),
          h('div', { class: 'row wrap' }, [sp, fq, h('label', { class: 'num small' }, [mn, h('span', { class: 'unit', text: '분/회' })])]),
          h('span', { class: 'lab', text: '강도' }),
          chips(INTENSITY, o => row.int === o, o => { row.int = o; changed(); redraw(); }, { name: '강도' }),
        ]));
      });
      const add = h('button', { type: 'button', class: 'addbtn', text: arr.length ? '+ 운동 하나 더 추가' : '+ 운동 추가' });
      add.addEventListener('click', () => { S[id + '_none'] = false; arr.push({ sport: '', freq: '', min: '', int: '' }); changed(); redraw(); });
      const no = h('button', { type: 'button', class: 'chip none', 'aria-pressed': S[id + '_none'] ? 'true' : 'false', text: '정기적으로 하는 운동 없음' });
      no.addEventListener('click', () => { S[id + '_none'] = !S[id + '_none']; if (S[id + '_none']) S[id] = []; changed(); redraw(); });
      body.append(h('div', { class: 'row wrap' }, [add, no]));
      break;
    }
    case 'scale': {
      const shown = q.items && q.items.length ? q.items.length : (DEMO && q.preview ? q.preview : q.n);
      const v = S[id] || {};
      for (let k = 1; k <= shown; k++) {
        const text = q.items && q.items[k - 1] ? `${k}. ${q.items[k - 1]}` : `${k}. [원문 ${k}번 문항 자리]`;
        body.append(h('div', { class: 'subq scale' }, [h('span', { class: 'lab', text }),
          chips(q.o, o => v[k] === o, o => { S[id] = { ...(S[id] || {}), [k]: o }; changed(); redraw(); }, { name: `${pick(q.q)} ${k}` })]));
      }
      if (shown < q.n) body.append(h('p', { class: 'muted', text: `… 이하 ${q.n - shown}문항 (실제 설문에는 ${q.n}문항이 모두 들어갑니다)` }));
      break;
    }
    case 'calc': {
      const dur = (a, b) => { if (!a || !b) return null; const [ah, am] = a.split(':').map(Number), [bh, bm] = b.split(':').map(Number); let m = (bh * 60 + bm) - (ah * 60 + am); if (m <= 0) m += 1440; return m; };
      const fmt = m => m == null ? '—' : `${Math.floor(m / 60)}시간 ${m % 60}분`;
      const on = S.sleep_onset || {}, wk = S.wake_time || {};
      const wd = dur(on.wd, wk.wd), we = dur(on.we, wk.we);
      const mid = (o, w) => { const d = dur(o, w); if (d == null) return null; const [oh, om] = o.split(':').map(Number); return (oh * 60 + om + d / 2) % 1440; };
      const mw = mid(on.wd, wk.wd), me = mid(on.we, wk.we);
      const sj = mw != null && me != null ? Math.round(Math.abs(((me - mw + 720 + 1440) % 1440) - 720)) : null;
      body.append(h('div', { class: 'calcbox' }, [
        h('p', { class: 'lab', text: '자동으로 계산한 수면시간' }),
        h('div', { class: 'pair' }, [
          h('div', { class: 'cell' }, [h('span', { class: 'lab', text: WD[0] }), h('strong', { class: 'big', text: fmt(wd) })]),
          h('div', { class: 'cell' }, [h('span', { class: 'lab', text: WD[1] }), h('strong', { class: 'big', text: fmt(we) })]),
        ]),
        h('p', { class: 'meta-line', text: `연구진 보기 · 주중·주말 수면 중간점 차이(사회적 시차) ${sj == null ? '—' : sj + '분'}` }),
      ]));
      break;
    }
  }
}

/* ---------- 화면 흐름 ---------- */
function changed() { refresh(); saveSoon(); }

function refresh() {
  const secs = activeSections();
  const sec = phase === 'q' ? secs[cur] : null;
  if (sec) qsOf(sec).forEach(q => {
    const el = document.querySelector(`.q[data-id="${q.id}"]`);
    if (!el) return;
    el.hidden = !qVisible(q);
    el.classList.toggle('done', q.t !== 'calc' && isAnswered(q));
    if (q.t === 'calc' || q.oBy) fill(q, el.querySelector('.qbody'));
  });
  if (phase === 'q') $('#step').textContent = `${cur + 1} / ${secs.length}`;
  const { total, done } = counts();
  $('#bar').style.width = (total ? done / total * 100 : 0) + '%';
  $('#count').textContent = `${done} / ${total}`;
}

function show(i) {
  phase = 'q';
  const secs = activeSections();
  cur = Math.max(0, Math.min(i, secs.length - 1));
  const sec = secs[cur];
  const main = $('#main'); main.innerHTML = '';
  $('#secname').textContent = sec.title;
  main.append(h('header', { class: 'sechead' }, [
    sec.week ? h('p', { class: 'eyebrow', text: '지난 7일 기준' }) : (sec.annual ? h('p', { class: 'eyebrow', text: '1년에 한 번' }) : null),
    h('h2', { text: sec.title }),
    sec.lead ? h('p', { class: 'lead', text: pick(sec.lead) }) : null,
  ]));
  qsOf(sec).forEach(q => main.append(render(q)));
  if (cur === 0) main.append(h('p', { id: 'intromsg', class: 'errline', role: 'alert', hidden: true }));
  $('#prev').disabled = cur === 0;
  $('#prev').hidden = false;
  $('#next').textContent = cur === secs.length - 1 ? '확인하고 제출' : '다음';
  refresh(); store.save();
  window.scrollTo({ top: 0 });
}

function review() {
  phase = 'review';
  const { total, done, missingCore } = counts();
  const main = $('#main'); main.innerHTML = '';
  $('#step').textContent = '확인'; $('#secname').textContent = '제출 전 확인';
  main.append(h('header', { class: 'sechead' }, [h('h2', { text: '제출하기 전에' }),
    h('p', { class: 'lead', text: `${total}개 질문 중 ${done}개에 답하셨습니다.` })]));
  if (missingCore.length) {
    const list = h('div', { class: 'misslist' });
    missingCore.forEach(({ si, q }) => {
      const b = h('button', { type: 'button', class: 'missitem' }, [h('span', { text: pick(q.q) }), h('span', { class: 'muted', text: activeSections()[si].title })]);
      b.addEventListener('click', () => { show(si); setTimeout(() => { const el = document.querySelector(`.q[data-id="${q.id}"]`); el && el.scrollIntoView({ block: 'center' }); }, 50); });
      list.append(b);
    });
    main.append(h('section', { class: 'q' }, [h('p', { class: 'qtext', text: `꼭 필요한 질문 ${missingCore.length}개가 비어 있습니다` }),
      h('p', { class: 'help', text: '누르면 해당 질문으로 이동합니다. 모르시면 그대로 제출하셔도 됩니다.' }), list]));
  } else {
    main.append(h('section', { class: 'q done' }, [h('p', { class: 'qtext', text: '꼭 필요한 질문에 모두 답하셨습니다.' })]));
  }
  $('#prev').disabled = false;
  $('#next').textContent = '제출하기';
  refresh(); window.scrollTo({ top: 0 });
}

function payload() {
  const answers = {};
  activeSections().forEach(sec => qsOf(sec).forEach(q => {
    if (q.t === 'calc' || q.secret || !qVisible(q)) return;
    if (S[q.id + '_none']) answers[q.id] = 'none';
    else if (isAnswered(q)) answers[q.id] = S[q.id];
  }));
  const pid = String(S.participant_id || '').trim().toUpperCase();
  answers.participant_id = pid;
  const visit = FORM === 'baseline' ? '0' : (S.visit_month || '');
  return {
    study: CFG.STUDY_NAME, form: FORM, form_version: CFG.FORM_VERSION,
    participant_id: pid, visit_month: visit,
    started_at: META.started_at, submitted_at: new Date().toISOString(), answers,
    row: window.SURVEY_FLATTEN.flatten(SECTIONS, FORM, answers),
  };
}

const ERR = {
  'invalid key': '설문 설정 오류입니다. 연구진에게 알려 주세요.',
  'invalid pid': '연구 번호 형식이 맞지 않습니다.',
  'invalid visit': '방문 차수가 맞지 않습니다.',
  'invalid code': '연구 번호와 참여 코드가 맞지 않습니다. 연구진에게 받은 링크로 다시 들어와 주세요.',
  'invalid form': '설문 종류 오류입니다. 연구진에게 알려 주세요.',
};

async function submit() {
  const data = payload();
  const btn = $('#next'); btn.disabled = true; btn.textContent = '보내는 중…';
  let res = null;                                        // null = 데모(전송 안 함)
  if (CFG.SUBMIT_URL) {
    try {
      // text/plain으로 보내면 사전 요청(preflight)이 생기지 않아 Apps Script와 호환됩니다.
      const r = await fetch(CFG.SUBMIT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...data, key: CFG.STUDY_KEY, code: String(S.access_code || '').trim().toUpperCase() }) });
      res = await r.json();
    } catch (e) { res = { ok: false, error: 'network' }; }
  }
  btn.disabled = false;
  done(data, res);
}

function done(data, res) {
  phase = 'done';
  const sent = res === null ? null : !!res.ok;
  if (sent !== false) store.clear();
  const main = $('#main'); main.innerHTML = '';
  $('#step').textContent = '완료'; $('#secname').textContent = sent === false ? '제출 실패' : '제출 완료';
  const json = JSON.stringify(data, null, 2);
  const msg = sent === true ? `응답이 연구팀에 전달되었습니다. 참여해 주셔서 감사합니다.`
    : sent === false ? (res.error === 'network' ? '인터넷 연결 문제로 보내지 못했습니다. 연결을 확인한 뒤 다시 제출해 주세요. 작성한 내용은 이 기기에 남아 있습니다.' : (ERR[res.error] || '보내지 못했습니다. 잠시 후 다시 시도해 주세요.'))
    : '저장 주소가 설정되지 않은 데모 모드라 응답을 보내지 않았습니다. 아래는 Google 시트에 저장될 내용입니다.';
  main.append(h('header', { class: 'sechead' }, [
    h('p', { class: 'eyebrow', text: sent === false ? '전송 실패' : sent ? '제출 완료' : '데모 모드' }),
    h('h2', { text: sent === false ? '다시 시도해 주세요' : '감사합니다' }),
    h('p', { class: 'lead', text: msg })]));
  if (sent === true && res.receipt) main.append(h('section', { class: 'q done' }, [h('p', { class: 'help', text: '접수번호' }), h('p', { class: 'big', text: res.receipt })]));
  if (sent === false) {
    const re = h('button', { type: 'button', class: 'btn primary', text: '다시 제출' }); re.addEventListener('click', submit);
    const back = h('button', { type: 'button', class: 'btn', text: '응답 고치기' }); back.addEventListener('click', () => show(0));
    main.append(h('div', { class: 'row wrap' }, [re, back]));
  }
  if (sent === null) {
    const pre = h('pre', { class: 'json', text: JSON.stringify(data.row, null, 2) });
    const cp = h('button', { type: 'button', class: 'btn ghost', text: '전체 자료(JSON) 복사' });
    cp.addEventListener('click', () => navigator.clipboard.writeText(json).then(() => { cp.textContent = '복사됨'; }, () => { cp.textContent = '복사할 수 없음'; }));
    main.append(h('section', { class: 'sumsec' }, [h('div', { class: 'row between' }, [h('h3', { text: '시트 한 행에 들어갈 값' }), cp]), pre]));
  }
  main.append(h('p', { class: 'muted', text: '문의: ' + CFG.CONTACT }));
  $('#prev').hidden = true;
  $('#next').textContent = '처음으로';
  window.scrollTo({ top: 0 });
}

function toc() {
  const box = $('#toc'), list = $('#toclist'); list.innerHTML = '';
  activeSections().forEach((sec, i) => {
    const qs = qsOf(sec).filter(q => q.t !== 'calc' && qVisible(q));
    const b = h('button', { type: 'button', class: 'tocitem' + (i === cur && phase === 'q' ? ' on' : '') }, [h('span', { text: `${i + 1}. ${sec.title}` }), h('span', { class: 'muted', text: `${qs.filter(isAnswered).length}/${qs.length}` })]);
    b.addEventListener('click', () => { box.hidden = true; show(i); });
    list.append(b);
  });
  box.hidden = !box.hidden;
}

/* ---------- 시작 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.title = `${FORM === 'baseline' ? '첫 방문 설문' : '정기 설문'} · ${CFG.STUDY_NAME}`;
  if (DEMO) document.body.classList.add('demo');
  // 링크로 받은 값 채우기 (예: followup.html?id=KY-0007&v=6&sex=여아)
  SECTIONS.forEach(sec => sec.qs.forEach(q => { if (q.fromUrl && URLP.get(q.fromUrl)) S[q.id] = URLP.get(q.fromUrl); }));
  const draft = store.load();
  if (draft && draft.S) {
    Object.assign(S, draft.S, Object.fromEntries(SECTIONS.flatMap(s => s.qs).filter(q => q.fromUrl && URLP.get(q.fromUrl)).map(q => [q.id, URLP.get(q.fromUrl)])));
    Object.assign(META, draft.META || {}); cur = draft.cur || 0;
    const bn = $('#draftnote'); bn.hidden = false;
    $('#restart').addEventListener('click', () => { store.clear(); location.reload(); });
  }
  $('#prev').addEventListener('click', () => { if (phase === 'review') show(activeSections().length - 1); else show(cur - 1); });
  $('#next').addEventListener('click', () => {
    if (phase === 'done') { for (const k in S) delete S[k]; META.started_at = new Date().toISOString(); location.href = location.href; return; }
    if (phase === 'review') { submit(); return; }
    if (cur === 0) {
      const bad = [];
      if (!new RegExp(CFG.PID_PATTERN).test(String(S.participant_id || '').trim().toUpperCase())) bad.push('participant_id');
      if (CFG.REQUIRE_CODE && CFG.SUBMIT_URL && !String(S.access_code || '').trim()) bad.push('access_code');
      document.querySelectorAll('.q.need').forEach(e => e.classList.remove('need'));
      if (bad.length) {
        bad.forEach(id => document.querySelector(`.q[data-id="${id}"]`).classList.add('need'));
        const first = document.querySelector(`.q[data-id="${bad[0]}"]`);
        first.scrollIntoView({ block: 'center' }); $('#in_' + bad[0]).focus();
        $('#intromsg').textContent = bad.includes('participant_id') ? `연구 번호를 ${CFG.PID_EXAMPLE} 형식으로 입력해 주세요.` : '참여 코드를 입력해 주세요.';
        $('#intromsg').hidden = false; return;
      }
    }
    if (cur >= activeSections().length - 1) review(); else show(cur + 1);
  });
  $('#tocbtn').addEventListener('click', toc);
  const rv = $('#rview');
  if (rv) rv.addEventListener('change', () => document.body.classList.toggle('researcher', rv.checked));
  show(cur);
});
})();
