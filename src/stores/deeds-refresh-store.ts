import { create } from 'zustand';

/** Bump after deed create/update/delete so lists refetch even without Supabase Realtime. */
export const useDeedsRefreshStore = create<{
  generation: number;
  bumpDeedsRefresh: () => void;
}>((set) => ({
  generation: 0,
  bumpDeedsRefresh: () => set((s) => ({ generation: s.generation + 1 })),
}));
