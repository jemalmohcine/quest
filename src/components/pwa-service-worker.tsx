'use client';

import { useEffect } from 'react';

/** Matches query on /public/sw.js — bump when SW logic changes. */
const SW_QUERY = 'v=20261110-chrono2';

export function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let reloadScheduled = false;

    const onControllerChange = () => {
      if (reloadScheduled) return;
      reloadScheduled = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker.register(`/sw.js?${SW_QUERY}`, { scope: '/' }).then((registration) => {
      const activateWaiting = (worker: ServiceWorker | null) => {
        worker?.postMessage({ type: 'SKIP_WAITING' });
      };

      if (registration.waiting) activateWaiting(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            activateWaiting(installing);
          }
        });
      });
    });

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  return null;
}
