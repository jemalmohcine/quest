import { create } from 'zustand';
import type { Pillar } from '@/types';

export const CHRONO_STORAGE_KEY = 'quest-task-timer-v1';

type PersistedChrono = {
  actionName: string;
  pillar: Pillar | null;
  feeling: string;
  sessionStartedAt: number | null;
  totalPausedMs: number;
  paused: boolean;
  pauseStartedAt: number | null;
  hasSession: boolean;
};

export function computeChronoElapsedMs(
  state: Pick<PersistedChrono, 'sessionStartedAt' | 'totalPausedMs' | 'paused' | 'pauseStartedAt' | 'hasSession'>,
  now = Date.now(),
): number {
  if (!state.hasSession || state.sessionStartedAt == null) return 0;
  if (state.paused && state.pauseStartedAt != null) {
    return Math.max(0, state.pauseStartedAt - state.sessionStartedAt - state.totalPausedMs);
  }
  return Math.max(0, now - state.sessionStartedAt - state.totalPausedMs);
}

function persistChrono(snapshot: PersistedChrono) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHRONO_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
}

export function loadChronoFromStorage(): PersistedChrono | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHRONO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedChrono;
  } catch {
    return null;
  }
}

function snapshotFromState(state: ChronometerState): PersistedChrono {
  return {
    actionName: state.actionName,
    pillar: state.pillar,
    feeling: state.feeling,
    sessionStartedAt: state.sessionStartedAt,
    totalPausedMs: state.totalPausedMs,
    paused: state.paused,
    pauseStartedAt: state.pauseStartedAt,
    hasSession: state.hasSession,
  };
}

type ChronometerState = PersistedChrono & {
  /** UI tick version — bumped on interval while active so React re-renders elapsed. */
  tickSeq: number;
  hydrated: boolean;
  getElapsedMs: () => number;
  bumpUiTick: () => void;
  hydrateFromStorage: () => void;
  start: () => boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setActionName: (name: string) => void;
  setPillar: (pillar: Pillar | null) => void;
  setFeeling: (feeling: string) => void;
};

const emptyPersisted = (): PersistedChrono => ({
  actionName: '',
  pillar: 'soulset',
  feeling: 'happy',
  sessionStartedAt: null,
  totalPausedMs: 0,
  paused: false,
  pauseStartedAt: null,
  hasSession: false,
});

export const useChronometerStore = create<ChronometerState>((set, get) => ({
  ...emptyPersisted(),
  tickSeq: 0,
  hydrated: false,
  getElapsedMs: () => computeChronoElapsedMs(get()),
  bumpUiTick: () => set((s) => ({ tickSeq: s.tickSeq + 1 })),
  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const loaded = loadChronoFromStorage();
    if (loaded) {
      set({ ...loaded, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
  start: () => {
    const { actionName, pillar, hasSession } = get();
    if (hasSession) return false;
    if (!actionName.trim() || !pillar) return false;
    const next: PersistedChrono = {
      ...get(),
      sessionStartedAt: Date.now(),
      totalPausedMs: 0,
      paused: false,
      pauseStartedAt: null,
      hasSession: true,
    };
    set({ ...next, tickSeq: get().tickSeq + 1 });
    persistChrono(next);
    return true;
  },
  pause: () => {
    const s = get();
    if (!s.hasSession || s.paused) return;
    const next: PersistedChrono = { ...s, paused: true, pauseStartedAt: Date.now() };
    set({ ...next, tickSeq: s.tickSeq + 1 });
    persistChrono(next);
  },
  resume: () => {
    const s = get();
    if (!s.hasSession || !s.paused || s.pauseStartedAt == null) return;
    const delta = Date.now() - s.pauseStartedAt;
    const next: PersistedChrono = {
      ...s,
      totalPausedMs: s.totalPausedMs + delta,
      paused: false,
      pauseStartedAt: null,
    };
    set({ ...next, tickSeq: s.tickSeq + 1 });
    persistChrono(next);
  },
  reset: () => {
    const cleared = { ...emptyPersisted(), feeling: get().feeling || 'happy' };
    set({ ...cleared, tickSeq: 0, hydrated: true });
    persistChrono(cleared);
  },
  setActionName: (actionName) => {
    const next = { ...snapshotFromState(get()), actionName };
    set({ actionName });
    if (!get().hasSession) persistChrono(next);
  },
  setPillar: (pillar) => {
    const next = { ...snapshotFromState(get()), pillar };
    set({ pillar });
    if (!get().hasSession) persistChrono(next);
  },
  setFeeling: (feeling) => {
    const next = { ...snapshotFromState(get()), feeling };
    set({ feeling });
    if (!get().hasSession) persistChrono(next);
  },
}));
