import { create } from 'zustand';

export type ShellTab = 'dashboard' | 'stats' | 'resumes' | 'more' | 'activities';

type ShellState = {
  activeTab: ShellTab;
  addModalOpen: boolean;
  audioAssistantOpen: boolean;
  setActiveTab: (tab: ShellTab) => void;
  setAddModalOpen: (open: boolean) => void;
  setAudioAssistantOpen: (open: boolean) => void;
  resetShell: () => void;
};

export const useShellStore = create<ShellState>((set) => ({
  activeTab: 'dashboard',
  addModalOpen: false,
  audioAssistantOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setAddModalOpen: (addModalOpen) => set({ addModalOpen }),
  setAudioAssistantOpen: (audioAssistantOpen) => set({ audioAssistantOpen }),
  resetShell: () =>
    set({
      activeTab: 'dashboard',
      addModalOpen: false,
      audioAssistantOpen: false,
    }),
}));
