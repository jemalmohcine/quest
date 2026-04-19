/**
 * Service worker minimal pour PWA.
 * Important : ne pas servir le HTML en cache-first après un déploiement Vite :
 * l'index en cache référence d'anciens /assets/*.js qui n'existent plus → page blanche.
 * Stratégie : toujours aller au réseau ; à l'activation, supprimer les anciens caches.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    return;
  }
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
