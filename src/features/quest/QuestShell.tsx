'use client';

import { useEffect, useState } from 'react';
import { useQuest } from './QuestProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { Dashboard } from './Dashboard';
import { Stats } from './Stats';
import { Resumes } from './Resumes';
import { More } from './More';
import { AddDeedModal } from './AddDeedModal';
import { AudioAssistant } from './AudioAssistant';
import { Activities } from './Activities';
import { Logo } from '@/components/Logo';
import { LayoutDashboard, BarChart3, FileText, MoreHorizontal, Plus, Loader2, Mic, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOBILE_SHELL } from '@/constants';
import { useShellStore } from '@/stores/shell-store';
import { FloatingQuestWidget } from './FloatingQuestWidget';

export function QuestShell() {
  const { user, loading, t } = useQuest();
  const activeTab = useShellStore((s) => s.activeTab);
  const setActiveTab = useShellStore((s) => s.setActiveTab);
  const addModalOpen = useShellStore((s) => s.addModalOpen);
  const setAddModalOpen = useShellStore((s) => s.setAddModalOpen);
  const audioOpen = useShellStore((s) => s.audioAssistantOpen);
  const setAudioOpen = useShellStore((s) => s.setAudioAssistantOpen);
  const resetShell = useShellStore((s) => s.resetShell);
  const [hasOpenedDashboard, setHasOpenedDashboard] = useState(false);

  useEffect(() => {
    if (user && !hasOpenedDashboard) {
      setActiveTab('dashboard');
      setHasOpenedDashboard(true);
    } else if (!user) {
      setHasOpenedDashboard(false);
      resetShell();
    }
  }, [user, hasOpenedDashboard, setActiveTab, resetShell]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quest</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-white">
        {/* Desktop : sidebar fixe (pas de scroll ici) — seul le <main> défile */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-20 hidden h-dvh w-64 flex-col overflow-hidden border-r border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95',
            'md:flex',
          )}
        >
          <div className="shrink-0 p-6 pb-4">
            <button
              type="button"
              className="group flex cursor-pointer items-center gap-3"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-110">
                <Logo size={24} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Quest</span>
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-hidden px-6 pb-4">
            {(
              [
                { id: 'dashboard' as const, label: t('dashboard'), icon: LayoutDashboard },
                { id: 'activities' as const, label: t('activities'), icon: History },
                { id: 'stats' as const, label: t('stats'), icon: BarChart3 },
                { id: 'resumes' as const, label: t('resumes'), icon: FileText },
                { id: 'more' as const, label: t('settings'), icon: MoreHorizontal },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200',
                  activeTab === item.id
                    ? 'bg-indigo-600/10 font-bold text-indigo-600 dark:text-indigo-400'
                    : 'font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="shrink-0 space-y-3 border-t border-zinc-200 bg-zinc-50/90 p-6 dark:border-zinc-800 dark:bg-zinc-900/90">
            <Button
              type="button"
              onClick={() => setAudioOpen(true)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-5 text-xs font-bold text-zinc-900 transition-transform hover:bg-zinc-200 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              <Mic className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {t('audioAssistant')}
            </Button>
            <Button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="w-full rounded-xl bg-indigo-600 py-5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:bg-indigo-500 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('logDeed')}
            </Button>
          </div>
        </aside>

        {/* Colonne contenu : pleine largeur sur mobile, décalée sur md pour la sidebar fixe */}
        <div className="flex min-h-dvh flex-col md:h-dvh md:min-h-0 md:pl-64">
          <main
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-auto pt-2 [-webkit-overflow-scrolling:touch]',
              MOBILE_SHELL.mainPaddingBottom,
            )}
          >
            <div className="mx-auto w-full max-w-6xl min-w-0 px-3 md:px-8">
              {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
              {activeTab === 'activities' && <Activities onBack={() => setActiveTab('dashboard')} />}
              {activeTab === 'stats' && <Stats />}
              {activeTab === 'resumes' && <Resumes />}
              {activeTab === 'more' && <More />}
            </div>
          </main>

          <div
            className={cn(
              'fixed right-[max(1rem,env(safe-area-inset-right,0px))] z-40 flex flex-col gap-3 md:hidden',
              MOBILE_SHELL.fabBottom,
            )}
          >
            <button
              type="button"
              onClick={() => setAudioOpen(true)}
              aria-label={t('audioAssistant')}
              className="flex h-[3.25rem] w-[3.25rem] min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-xl transition-all hover:bg-zinc-800 active:scale-95"
            >
              <Mic className="h-6 w-6 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              aria-label={t('logDeed')}
              className="quest-interactive flex h-[3.25rem] w-[3.25rem] min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-600 shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500"
            >
              <Plus className="h-7 w-7 text-white" />
            </button>
          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/90 bg-white/96 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[0_-4px_24px_rgb(0_0_0/0.04)] backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/96 dark:shadow-[0_-4px_24px_rgb(0_0_0/0.35)] md:hidden">
            <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-1">
              {(
                [
                  { id: 'dashboard' as const, label: t('dashboard'), icon: LayoutDashboard },
                  { id: 'activities' as const, label: t('activities'), icon: History },
                  { id: 'stats' as const, label: t('stats'), icon: BarChart3 },
                  { id: 'resumes' as const, label: t('resumes'), icon: FileText },
                  { id: 'more' as const, label: t('settings'), icon: MoreHorizontal },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex min-h-11 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-colors',
                    activeTab === item.id
                      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="w-full truncate text-center text-[9px] font-bold uppercase leading-tight tracking-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        <FloatingQuestWidget />
        <AddDeedModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
        <AudioAssistant isOpen={audioOpen} onClose={() => setAudioOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}
