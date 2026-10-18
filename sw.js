// Service worker mínimo: só habilita a instalação do app. Não guarda cache (evita versões velhas).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
