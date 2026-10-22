// Lomell — service worker (abre o app sem internet). Versão: 2
const CACHE = 'lomell-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const CDN_HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function networkFirst(req, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html')).then(r => { if (!done) { done = true; resolve(r || Response.error()); } });
    const timer = setTimeout(fallback, timeoutMs);
    fetch(req).then(res => {
      clearTimeout(timer);
      if (!done) { done = true; resolve(res); }
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    }).catch(() => { clearTimeout(timer); fallback(); });
  });
}

function cacheFirst(req) {
  return caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req, 4000));
  } else if (CDN_HOSTS.includes(url.hostname) && (url.pathname.includes('/firebasejs/') || url.hostname !== 'www.gstatic.com')) {
    e.respondWith(cacheFirst(req));
  }
});
