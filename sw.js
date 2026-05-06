/* ════════════════════════════════════════════════════════════
   PSCFO Service Worker v6.5
   策略: Cache First for app shell, Network First for data
   ════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'pscfo-v6.5';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
];

// 安装：预缓存 App Shell
self.addEventListener('install', event => {
  console.log('[SW] Install v6.5');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(SHELL_FILES);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧版缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activate v6.5');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：Cache First 策略
self.addEventListener('fetch', event => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 只缓存成功的 GET 请求
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // 离线且无缓存时，返回 index.html（SPA fallback）
        return caches.match('./index.html');
      });
    })
  );
});
