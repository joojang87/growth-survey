/**
 * 성장·사춘기 코호트 보호자 설문 — Google Apps Script 수신부 (v{{FORM_VERSION}})
 *
 * 응답 저장용 Google 시트에서 '확장 프로그램 > Apps Script'를 열고 이 파일 전체를 붙여 넣습니다.
 * 아래 COLUMNS는 questions.js에서 자동 생성한 값입니다. 문항을 바꾸면 tools/make-backend.js로 다시 만드세요.
 *
 * 저장 구조
 *   - 탭 이름 = 설문종류_버전 (예: baseline_0.2, followup_0.2). 버전을 올리면 새 탭이 생겨 열이 섞이지 않음
 *   - 응답 1건 = 1행. 정의된 열만 저장하고, 원자료 전체는 raw_json 열에 보관
 *   - participants 탭: 연구 번호별 참여 코드(링크에 넣어 보냄). setupParticipants()로 한 번 만듦
 */

/* ===== 설정 (index.html 쪽 config.js와 맞출 것) ===== */
const STUDY_KEY    = 'change-me';          // config.js의 STUDY_KEY와 같게
const PID_RE       = /^GP-\d{3}$/;          // config.js의 PID_PATTERN과 같게
const REQUIRE_CODE = true;                  // 참여 코드 확인 여부 (config.js의 REQUIRE_CODE와 같게)
const N_PARTICIPANTS = 150;                 // setupParticipants()가 만들 번호 수 (GP-001 ~ GP-150)
const VISITS = {
  baseline: ['0'],
  followup: ['3', '6', '9', '12', '15', '18', '21', '24', '27', '30', '33', '36'],
};
/* =================================================== */

const META = ['receipt', 'server_time', 'form', 'form_version', 'participant_id', 'visit_month', 'started_at', 'submitted_at', 'duplicate_of'];
const COLUMNS = {{COLUMNS}};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);                     // 동시 제출 시 행이 겹치지 않도록
    const data = JSON.parse(e.postData.contents);

    // 1) 검증
    if (data.key !== STUDY_KEY) return json_({ ok: false, error: 'invalid key' });
    const form = String(data.form || '');
    if (!COLUMNS[form]) return json_({ ok: false, error: 'invalid form' });
    const pid = String(data.participant_id || '').trim().toUpperCase();
    if (!PID_RE.test(pid)) return json_({ ok: false, error: 'invalid pid' });
    const visit = String(data.visit_month || '');
    if (VISITS[form].indexOf(visit) < 0) return json_({ ok: false, error: 'invalid visit' });
    if (REQUIRE_CODE && !codeOk_(pid, String(data.code || '').trim().toUpperCase())) return json_({ ok: false, error: 'invalid code' });

    // 2) 탭 준비 (설문종류_버전)
    const version = String(data.form_version || '0').replace(/[^0-9A-Za-z.\-]/g, '').slice(0, 10);
    const header = META.concat(COLUMNS[form], ['raw_json']);
    const sh = sheet_(`${form}_${version}`, header);

    // 3) 같은 번호·같은 차수 이전 응답 확인 (막지 않고 표시만)
    const prev = findPrevious_(sh, pid, visit);

    // 4) 저장 — 정의된 열만, 셀당 최대 길이 제한
    const row = data.row || {};
    const receipt = Utilities.getUuid().slice(0, 8).toUpperCase();
    const values = [receipt, new Date(), form, version, pid, visit, clip_(data.started_at, 40), clip_(data.submitted_at, 40), prev]
      .concat(COLUMNS[form].map(c => (row[c] === undefined || row[c] === null) ? '' : clip_(row[c], 2000)))
      .concat([clip_(JSON.stringify(data.answers || {}), 45000)]);
    sh.appendRow(values);
    return json_({ ok: true, receipt: receipt, duplicate: !!prev });
  } catch (err) {
    return json_({ ok: false, error: 'server error' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, msg: 'survey endpoint alive', version: '{{FORM_VERSION}}' });
}

/* ---------- 참여 코드 ---------- */
// Apps Script 편집기에서 이 함수를 한 번 실행하면 participants 탭이 만들어집니다(이미 있으면 그대로 둠).
function setupParticipants() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('participants')) return 'participants 탭이 이미 있습니다.';
  const sh = ss.insertSheet('participants');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 헷갈리는 0·O·1·I 제외
  const rows = [['participant_id', 'code', 'active', 'note']];
  for (let i = 1; i <= N_PARTICIPANTS; i++) {
    let c = '';
    for (let k = 0; k < 6; k++) c += chars.charAt(Math.floor(Math.random() * chars.length));
    rows.push([`GP-${String(i).padStart(3, '0')}`, c, true, '']);
  }
  sh.getRange(1, 1, rows.length, 4).setValues(rows);
  sh.setFrozenRows(1);
  return `${N_PARTICIPANTS}명분 코드를 만들었습니다.`;
}

function codeOk_(pid, code) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('participants');
  if (!sh || !code) return false;
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]).toUpperCase() === pid) return String(v[i][1]).toUpperCase() === code && v[i][2] !== false && String(v[i][2]).toUpperCase() !== 'FALSE';
  }
  return false;
}

/* ---------- 도구 ---------- */
function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function findPrevious_(sh, pid, visit) {
  const n = sh.getLastRow();
  if (n < 2) return '';
  const v = sh.getRange(2, 1, n - 1, 6).getValues();   // receipt … visit_month
  for (let i = v.length - 1; i >= 0; i--) {
    if (String(v[i][4]) === pid && String(v[i][5]) === visit) return String(v[i][0]);
  }
  return '';
}

function clip_(x, n) {
  const s = typeof x === 'string' ? x : (x === undefined || x === null ? '' : String(x));
  // 수식으로 해석되지 않도록 =,+,-,@로 시작하는 글은 앞에 '를 붙임
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s;
  return safe.slice(0, n);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
