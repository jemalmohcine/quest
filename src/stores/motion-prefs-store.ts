import { create } from 'zustand';

/**
 * Préférences motion / accessibilité — branchées sur prefers-reduced-motion.
 */
type MotionPrefs = {
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
};

export const useMotionPrefsStore = create<MotionPrefs>((set) => ({
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
