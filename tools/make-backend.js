/*
 * questions.js가 바뀌면 실행: node tools/make-backend.js
 *  - backend/Code.gs 의 COLUMNS(시트 열 목록)를 다시 만듭니다.
 *  - docs/sheet-columns.csv (시트 열 ↔ 문항 대응표)를 다시 만듭니다.
 * 실행 후 Apps Script 편집기에 Code.gs를 다시 붙여 넣고 "새 버전"으로 재배포하세요.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
const ctx = { window: {}, globalThis: {} };
vm.createContext(ctx);
['assets/js/config.js', 'assets/js/questions.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8'), ctx));
const { SECTIONS } = ctx.window.SURVEY;
const CFG = ctx.window.SURVEY_CONFIG;
const { columnsFor, columnsOf } = require(path.join(R, 'assets/js/flatten.js'));

const COLUMNS = { baseline: columnsFor(SECTIONS, 'baseline'), followup: columnsFor(SECTIONS, 'followup') };
const tpl = fs.readFileSync(path.join(R, 'tools/Code.template.gs'), 'utf8');
const gs = tpl.replace('{{COLUMNS}}', JSON.stringify(COLUMNS, null, 2)).split('{{FORM_VERSION}}').join(CFG.FORM_VERSION);
fs.mkdirSync(path.join(R, 'backend'), { recursive: true });
fs.writeFileSync(path.join(R, 'backend/Code.gs'), gs);

const lines = ['form,column,question_id,question,section'];
['baseline', 'followup'].forEach(form => SECTIONS.filter(s => s.forms.includes(form)).forEach(sec =>
  sec.qs.filter(q => !q.forms || q.forms.includes(form)).forEach(q => columnsOf(q).forEach(c => {
    const qt = typeof q.q === 'object' ? q.q[form] : q.q;
    lines.push([form, c, q.id, `"${String(qt).replace(/"/g, '""')}"`, sec.title].join(','));
  }))));
fs.mkdirSync(path.join(R, 'docs'), { recursive: true });
fs.writeFileSync(path.join(R, 'docs/sheet-columns.csv'), '﻿' + lines.join('\n'));
console.log(`baseline ${COLUMNS.baseline.length}열, followup ${COLUMNS.followup.length}열 → backend/Code.gs, docs/sheet-columns.csv`);
