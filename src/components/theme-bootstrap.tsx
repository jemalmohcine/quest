'use client';

import { useLayoutEffect } from 'react';
import { applyDomTheme, readPersistedTheme } from '@/lib/theme-preference';

/** Réapplique le thème après hydratation + suit le thème système si préférence « system ». */
export function ThemeBootstrap() {
  useLayoutEffect(() => {
    const stored = readPersistedTheme() ?? 'system';
    applyDomTheme(stored);
    if (stored !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDomTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return null;
}
