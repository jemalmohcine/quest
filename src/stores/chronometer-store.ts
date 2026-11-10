import { create } from 'zustand';

type ChronometerState = {
  running: boolean;
  startedAt: number | null;
  elapsedMs: number;
  pillar: import('@/types').Pillar | null;
  actionName: string;
  tick: () => void;
  start: (actionName?: string, pillar?: import('@/types').Pillar | null) => void;
  stop: () => number;
  reset: () => void;
  setActionName: (name: string) => void;
  setPillar: (pillar: import('@/types').Pillar | null) => void;
};

export const useChronometerStore = create<ChronometerState>((set, get) => ({
  running: false,
  startedAt: null,
  elapsedMs: 0,
  pillar: null,
  actionName: '',
  tick: () => {
    const { running, startedAt } = get();
    if (!running || startedAt == null) return;
    set({ elapsedMs: Date.now() - startedAt });
  },
  start: (actionName = '', pillar = null) => {
    set({
      running: true,
      startedAt: Date.now(),
      elapsedMs: 0,
      actionName,
      pillar,
    });
  },
  stop: () => {
    const { running, startedAt, elapsedMs } = get();
    let total = elapsedMs;
    if (running && startedAt != null) {
      total = Date.now() - startedAt;
    }
    set({ running: false, startedAt: null, elapsedMs: total });
    return Math.max(0, Math.round(total / 60000));
  },
  reset: () =>
    set({
      running: false,
      startedAt: null,
      elapsedMs: 0,
      actionName: '',
      pillar: null,
    }),
  setActionName: (actionName) => set({ actionName }),
  setPillar: (pillar) => set({ pillar }),
}));
