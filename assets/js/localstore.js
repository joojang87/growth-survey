/*
 * 기기 저장소 — 응답을 이 기기(iPad)의 브라우저 데이터베이스(IndexedDB)에만 저장합니다.
 * 인터넷으로 보내지 않습니다. 연구진은 data.html에서 CSV·JSON 파일로 내보내 원내 저장공간으로 옮깁니다.
 *
 * 주의: Safari 탭에서 쓰면 7일 넘게 이 사이트를 열지 않을 때 저장 자료가 지워질 수 있습니다(WebKit 정책).
 *       반드시 "홈 화면에 추가"한 아이콘으로 열어 쓰고, 정기적으로 내보내기 하세요.
 */
(function (root) {
'use strict';
const DB = 'growth-survey', STORE = 'responses', VER = 1;

function open() {
  return new Promise((ok, bad) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'uid' });
        s.createIndex('form', 'form');
      }
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => bad(r.error);
  });
}
function tx(mode, fn) {
  return open().then(db => new Promise((ok, bad) => {
    const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
    let out; Promise.resolve(fn(s)).then(v => { out = v; });
    t.oncomplete = () => { db.close(); ok(out); };
    t.onerror = t.onabort = () => { db.close(); bad(t.error); };
  }));
}
const req = r => new Promise((ok, bad) => { r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });

const pad = n => String(n).padStart(2, '0');
function stamp(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; }
function receipt() {
  const a = new Uint8Array(4); (root.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const api = {
  /** 응답 1건 저장. 같은 연구 번호·설문·방문이 이미 있으면 duplicate_of에 앞선 접수번호를 적습니다. */
  async add(data) {
    const all = await api.all();
    const prev = all.filter(r => r.participant_id === data.participant_id && r.form === data.form && String(r.visit_month) === String(data.visit_month));
    const rec = {
      ...data,
      uid: `${data.participant_id}_${data.form}_${data.visit_month}_${stamp(new Date())}_${receipt().slice(0, 4)}`,
      receipt: receipt(),
      saved_at: new Date().toISOString(),
      duplicate_of: prev.length ? prev[prev.length - 1].receipt : '',
      exported_at: '',
    };
    await tx('readwrite', s => req(s.put(rec)));
    return rec;
  },
  all() { return tx('readonly', s => req(s.getAll())).then(a => a.sort((x, y) => String(x.saved_at).localeCompare(String(y.saved_at)))); },
  markExported(uids, when) { return tx('readwrite', async s => { for (const u of uids) { const r = await req(s.get(u)); if (r) { r.exported_at = when; await req(s.put(r)); } } }); },
  remove(uids) { return tx('readwrite', async s => { for (const u of uids) await req(s.delete(u)); }); },
  /** 저장공간을 '지속'으로 요청(홈 화면 앱에서 효과). 결과 true/false */
  async persist() { try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch (e) { return false; } },
  async persisted() { try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (e) { return false; } },
  stamp,
};
root.SURVEY_LOCAL = api;
})(window);
