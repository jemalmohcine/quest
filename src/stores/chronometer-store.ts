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
  frozenElapsedMs: number | null;
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
    const parsed = JSON.parse(raw) as PersistedChrono;
    return { ...parsed, frozenElapsedMs: parsed.frozenElapsedMs ?? null };
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
    frozenElapsedMs: state.frozenElapsedMs,
  };
}

type ChronometerState = PersistedChrono & {
  tickSeq: number;
  hydrated: boolean;
  savePending: boolean;
  getElapsedMs: () => number;
  bumpUiTick: () => void;
  hydrateFromStorage: () => void;
  start: () => boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  freezeForLog: () => number;
  beginSave: () => boolean;
  endSave: () => void;
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
  frozenElapsedMs: null,
});

export const useChronometerStore = create<ChronometerState>((set, get) => ({
  ...emptyPersisted(),
  tickSeq: 0,
  hydrated: false,
  savePending: false,
  getElapsedMs: () => {
    const s = get();
    if (s.frozenElapsedMs != null) return s.frozenElapsedMs;
    return computeChronoElapsedMs(s);
  },
  bumpUiTick: () => set((s) => ({ tickSeq: s.tickSeq + 1 })),
  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const loaded = loadChronoFromStorage();
    if (loaded) {
      set({ ...loaded, hydrated: true, savePending: false });
    } else {
      set({ hydrated: true });
    }
  },
  start: () => {
    const { actionName, pillar, hasSession, savePending } = get();
    if (savePending || hasSession) return false;
    if (!actionName.trim() || !pillar) return false;
    const next: PersistedChrono = {
      ...get(),
      sessionStartedAt: Date.now(),
      totalPausedMs: 0,
      paused: false,
      pauseStartedAt: null,
      hasSession: true,
      frozenElapsedMs: null,
    };
    set({ ...next, tickSeq: get().tickSeq + 1 });
    persistChrono(next);
    return true;
  },
  pause: () => {
    const s = get();
    if (!s.hasSession || s.paused || s.savePending || s.frozenElapsedMs != null) return;
    const next: PersistedChrono = { ...s, paused: true, pauseStartedAt: Date.now() };
    set({ ...next, tickSeq: s.tickSeq + 1 });
    persistChrono(next);
  },
  resume: () => {
    const s = get();
    if (!s.hasSession || !s.paused || s.pauseStartedAt == null || s.savePending || s.frozenElapsedMs != null) return;
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
  freezeForLog: () => {
    const s = get();
    const ms = s.frozenElapsedMs ?? computeChronoElapsedMs(s);
    let next: PersistedChrono = { ...s, frozenElapsedMs: ms };
    if (s.hasSession && !s.paused) {
      const now = Date.now();
      next = { ...next, paused: true, pauseStartedAt: now };
    }
    set({ ...next, tickSeq: s.tickSeq + 1 });
    persistChrono(next);
    return ms;
  },
  beginSave: () => {
    if (get().savePending) return false;
    set({ savePending: true });
    return true;
  },
  endSave: () => {
    set({ savePending: false });
  },
  reset: () => {
    const cleared = { ...emptyPersisted(), feeling: get().feeling || 'happy' };
    set({ ...cleared, tickSeq: 0, hydrated: true, savePending: false });
    persistChrono(cleared);
  },
  setActionName: (actionName) => {
    if (get().savePending) return;
    const next = { ...snapshotFromState(get()), actionName };
    set({ actionName });
    if (!get().hasSession) persistChrono(next);
  },
  setPillar: (pillar) => {
    if (get().savePending) return;
    const next = { ...snapshotFromState(get()), pillar };
    set({ pillar });
    if (!get().hasSession) persistChrono(next);
  },
  setFeeling: (feeling) => {
    if (get().savePending) return;
    const next = { ...snapshotFromState(get()), feeling };
    set({ feeling });
    if (!get().hasSession) persistChrono(next);
  },
}));
