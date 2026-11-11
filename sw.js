/*
 * 오프라인 동작용 서비스 워커 — 설문 화면 파일을 iPad에 보관해 인터넷이 끊겨도 열리게 합니다.
 * 응답 자료는 다루지 않습니다(응답은 IndexedDB에만 저장).
 * 파일을 고치면 VERSION을 올려야 iPad가 새 파일을 받습니다.
 */
const VERSION = 'gs-v0.5-1';
const FILES = [
  './', 'index.html', 'baseline.html', 'followup.html', 'scales.html', 'data.html', 'manifest.webmanifest',
  'assets/css/style.css', 'assets/js/config.js', 'assets/js/questions.js', 'assets/js/scoring.js',
  'assets/js/flatten.js', 'assets/js/localstore.js', 'assets/js/survey.js',
  'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 같은 출처 파일: 네트워크 우선(새 버전 반영), 실패하면 보관본. 다른 출처(글꼴 등): 그대로 통과.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
