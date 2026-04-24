'use client';

import { useEffect } from 'react';
import { QuestProvider } from '@/features/quest/QuestProvider';
import { useMotionPrefsStore } from '@/stores/motion-prefs-store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => useMotionPrefsStore.getState().setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return <QuestProvider>{children}</QuestProvider>;
}
