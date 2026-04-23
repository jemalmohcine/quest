import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './components/Dashboard';
import { Stats } from './components/Stats';
import { Resumes } from './components/Resumes';
import { More } from './components/More';
import { AddDeedModal } from './components/AddDeedModal';
import { AudioAssistant } from './components/AudioAssistant';
import { LandingPage } from './components/LandingPage';
import { AuthForms } from './components/AuthForms';
import { Activities } from './components/Activities';
import { Privacy } from './components/Privacy';
import { Terms } from './components/Terms';
import { Contact } from './components/Contact';
import { ScientificMethod } from './components/ScientificMethod';
import { Logo } from './components/Logo';
import { LayoutDashboard, BarChart3, FileText, MoreHorizontal, Plus, Loader2, Mic, History } from 'lucide-react';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

function AppContent() {
  const { user, loading, t } = useFirebase();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'resumes' | 'more' | 'activities'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAudioAssistantOpen, setIsAudioAssistantOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [hasShownDashboardOnLogin, setHasShownDashboardOnLogin] = useState(false);

  useEffect(() => {
    if (user && !hasShownDashboardOnLogin) {
      setActiveTab('dashboard');
      setHasShownDashboardOnLogin(true);
    } else if (!user) {
      setHasShownDashboardOnLogin(false);
    }
  }, [user, hasShownDashboardOnLogin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/privacy" element={<Privacy onBack={() => navigate('/')} />} />
      <Route path="/terms" element={<Terms onBack={() => navigate('/')} />} />
      <Route path="/contact" element={<Contact onBack={() => navigate('/')} />} />
      <Route path="/scientific-method" element={<ScientificMethod onBack={() => navigate('/')} />} />
      <Route path="/*" element={
        !user ? (
          showAuth ? (
            <AuthForms onBack={() => setShowAuth(false)} />
          ) : (
            <LandingPage onGetStarted={() => setShowAuth(true)} />
          )
        ) : (
          <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-xl">
              <div className="p-6">
                <div 
                  className="flex items-center gap-3 mb-10 cursor-pointer group"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Logo size={24} className="text-white" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Quest</span>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
                    { id: 'activities', label: t('activities'), icon: History },
                    { id: 'stats', label: t('stats'), icon: BarChart3 },
                    { id: 'resumes', label: t('resumes'), icon: FileText },
                    { id: 'more', label: t('settings'), icon: MoreHorizontal },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                        activeTab === item.id 
                          ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold" 
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-6 space-y-3">
                <Button 
                  onClick={() => setIsAudioAssistantOpen(true)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl py-5 border border-zinc-200 dark:border-zinc-700 transition-transform active:scale-95 text-xs font-bold"
                >
                  <Mic className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  {t('audioAssistant')}
                </Button>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-5 shadow-lg shadow-indigo-500/20 transition-transform active:scale-95 text-xs font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('logDeed')}
                </Button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50/30 dark:bg-zinc-950">
              <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain pt-2 pb-24 [-webkit-overflow-scrolling:touch] md:pb-8">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      onTabChange={setActiveTab as any} 
                    />
                  )}
                  {activeTab === 'activities' && <Activities onBack={() => setActiveTab('dashboard')} />}
                  {activeTab === 'stats' && <Stats />}
                  {activeTab === 'resumes' && <Resumes />}
                  {activeTab === 'more' && <More />}
                </div>
              </main>

              {/* Floating Action Buttons (Mobile) */}
              <div className="md:hidden fixed bottom-[92px] right-4 flex flex-col gap-4 z-40">
                <button 
                  onClick={() => setIsAudioAssistantOpen(true)}
                  className="w-14 h-14 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl hover:bg-zinc-800 transition-all active:scale-90"
                >
                  <Mic className="w-6 h-6 text-indigo-400" />
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-14 h-14 bg-primary-kinetic border border-white/10 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all active:scale-90"
                >
                  <Plus className="w-8 h-8 text-on-primary" />
                </button>
              </div>

              {/* Mobile Bottom Navigation */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-3 z-50">
                <div className="w-full flex items-center justify-between">
                  {[
                    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
                    { id: 'activities', label: t('activities'), icon: History },
                    { id: 'stats', label: t('stats'), icon: BarChart3 },
                    { id: 'resumes', label: t('resumes'), icon: FileText },
                    { id: 'more', label: t('settings'), icon: MoreHorizontal },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-colors flex-1 min-w-0",
                        activeTab === item.id ? "text-indigo-600 dark:text-indigo-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-[7.5px] font-bold uppercase tracking-tight truncate w-full text-center leading-none mt-0.5">{item.label}</span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            <AddDeedModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <AudioAssistant isOpen={isAudioAssistantOpen} onClose={() => setIsAudioAssistantOpen(false)} />
          </div>
        )
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <AppContent />
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
