import { useFirebase } from './FirebaseProvider';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  Sparkles, 
  Activity, 
  Brain, 
  Zap, 
  Heart
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { } = useFirebase();

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary-kinetic selection:text-on-primary font-body antialiased overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/70 backdrop-blur-xl bg-gradient-to-b from-[#131313] to-transparent shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-6 md:px-12 py-6 w-full">
          <div className="flex items-center gap-4">
            <Logo size={40} className="w-10 h-auto" />
            <span className="text-2xl font-black tracking-tighter text-white font-headline uppercase">QUEST</span>
          </div>
          <nav className="hidden lg:flex gap-8">
            <Link to="/scientific-method" className="font-headline tracking-tighter font-bold uppercase text-[10px] text-[#adaaaa] hover:text-white transition-all active:scale-95 whitespace-nowrap">Method</Link>
            <Link to="/privacy" className="font-headline tracking-tighter font-bold uppercase text-[10px] text-[#adaaaa] hover:text-white transition-all active:scale-95 whitespace-nowrap">Privacy</Link>
            <Link to="/terms" className="font-headline tracking-tighter font-bold uppercase text-[10px] text-[#adaaaa] hover:text-white transition-all active:scale-95 whitespace-nowrap">Terms</Link>
            <Link to="/contact" className="font-headline tracking-tighter font-bold uppercase text-[10px] text-[#adaaaa] hover:text-white transition-all active:scale-95 whitespace-nowrap">Contact</Link>
          </nav>
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={onGetStarted} className="hidden sm:block font-headline text-[10px] md:text-sm font-bold uppercase text-[#adaaaa] hover:text-white transition-colors">Login</button>
            <Button 
              onClick={onGetStarted}
              className="bg-primary-kinetic text-on-primary px-5 md:px-8 py-2.5 md:py-3 font-headline font-bold uppercase tracking-widest text-[10px] md:text-sm rounded-sm hover:shadow-[0_0_20px_rgba(165,165,255,0.4)] transition-all active:scale-95 h-9 md:h-auto"
            >
              Begin Quest
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-50" 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-zinc-950"></div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-5xl w-full mt-4 md:mt-0"
          >
            <div className="flex flex-wrap items-center gap-3 md:gap-8 mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-secondary-kinetic shadow-[0_0_10px_#60fe6c] shrink-0"></span>
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 whitespace-nowrap">System Online: Version 2.4 Kinetic</span>
              </div>
            </div>
            <h1 className="font-headline text-6xl md:text-[120px] leading-[0.85] font-black tracking-tighter uppercase mb-8">
              Master Your <br/> <span className="text-primary-kinetic text-glow-primary">Life's Journey</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
              Enter the Kinetic Vault. A high-performance framework designed for holistic excellence through the <span className="text-white font-bold">5 Pillar Architecture</span>. Align your daily deeds with your ultimate evolution.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-primary-kinetic text-on-primary px-12 py-5 h-auto font-headline font-black uppercase tracking-widest text-lg rounded-sm hover:shadow-[0_0_30px_rgba(165,165,255,0.6)] transition-all active:scale-95"
              >
                Start Your Quest
              </Button>
              <div className="flex -space-x-4">
                {[
                  "https://picsum.photos/seed/athlete/100/100",
                  "https://picsum.photos/seed/tech/100/100",
                  "https://picsum.photos/seed/zen/100/100"
                ].map((src, i) => (
                  <img 
                    key={i}
                    className="w-12 h-12 rounded-full border-2 border-zinc-950" 
                    src={src} 
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">+12K</div>
              </div>
              <span className="text-zinc-500 text-sm font-medium tracking-wide italic">Join the elite performance collective.</span>
            </div>
          </motion.div>
        </section>

        {/* 5 Pillars Bento Grid */}
        <section id="pillars" className="py-32 px-6 md:px-12 bg-zinc-900/40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4">The 5 Pillar Architecture</h2>
              <p className="text-zinc-400 text-lg">Achieve total alignment by optimizing the five dimensions of human performance.</p>
            </div>
            <div className="font-headline text-6xl md:text-8xl font-black text-white/5 tracking-tighter">01 / OS</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[800px]">
            {/* Soulset */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="soulset"
              className="md:col-span-8 bg-zinc-900 rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-pillar-soul opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <span className="text-primary-kinetic text-xs font-black tracking-[0.3em] uppercase mb-4 block">Pillar 01</span>
                <h3 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter mb-6">Soulset</h3>
                <p className="max-w-md text-zinc-400 text-lg">Harness spiritual growth and deep existential purpose. Align your core values with daily action.</p>
              </div>
              <div className="relative z-10 flex justify-between items-end mt-12">
                <div className="flex gap-4">
                  <span className="px-4 py-1 rounded-full border border-primary-kinetic/20 text-[10px] font-black uppercase text-primary-kinetic tracking-widest">Meditation</span>
                  <span className="px-4 py-1 rounded-full border border-primary-kinetic/20 text-[10px] font-black uppercase text-primary-kinetic tracking-widest">Purpose</span>
                </div>
                <Sparkles className="text-primary-kinetic w-12 h-12" />
              </div>
            </motion.div>

            {/* Healthset */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              id="healthset"
              className="md:col-span-4 bg-zinc-900 rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-pillar-health opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <span className="text-secondary-kinetic text-xs font-black tracking-[0.3em] uppercase mb-4 block">Pillar 02</span>
                <h3 className="text-4xl font-headline font-black uppercase tracking-tighter mb-4">Healthset</h3>
                <p className="text-zinc-400">Peak biological vitality and habit tracking.</p>
              </div>
              <div className="relative z-10 flex flex-col gap-6 mt-12">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-secondary-kinetic"></div>
                </div>
                <Activity className="text-secondary-kinetic w-12 h-12" />
              </div>
            </motion.div>

            {/* Mindset */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              id="mindset"
              className="md:col-span-4 bg-zinc-900 rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-pillar-mind opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <span className="text-indigo-400 text-xs font-black tracking-[0.3em] uppercase mb-4 block">Pillar 03</span>
                <h3 className="text-4xl font-headline font-black uppercase tracking-tighter mb-4">Mindset</h3>
                <p className="text-zinc-400">Mental resilience and cognitive clarity optimization.</p>
              </div>
              <div className="relative z-10 mt-12">
                <Brain className="text-indigo-400 w-12 h-12" />
              </div>
            </motion.div>

            {/* Skillset */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              id="skillset"
              className="md:col-span-4 bg-zinc-900 rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-pillar-skill opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <span className="text-tertiary-kinetic text-xs font-black tracking-[0.3em] uppercase mb-4 block">Pillar 04</span>
                <h3 className="text-4xl font-headline font-black uppercase tracking-tighter mb-4">Skillset</h3>
                <p className="text-zinc-400">Mastery of craft and relentless knowledge acquisition.</p>
              </div>
              <div className="relative z-10 mt-12">
                <Zap className="text-tertiary-kinetic w-12 h-12" />
              </div>
            </motion.div>

            {/* Heartset */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              id="heartset"
              className="md:col-span-4 bg-zinc-900 rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-pillar-heart opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <span className="text-error-kinetic text-xs font-black tracking-[0.3em] uppercase mb-4 block">Pillar 05</span>
                <h3 className="text-4xl font-headline font-black uppercase tracking-tighter mb-4">Heartset</h3>
                <p className="text-zinc-400">Emotional intelligence and deep human connection.</p>
              </div>
              <div className="relative z-10 mt-12">
                <Heart className="text-error-kinetic w-12 h-12" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* AI Narrative Resume Section */}
        <section className="py-40 px-6 md:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative group">
              <div className="absolute -inset-10 bg-primary-kinetic/10 blur-[100px] rounded-full opacity-50"></div>
              <div className="relative glass-panel rounded-xl p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-lg bg-primary-kinetic/20 flex items-center justify-center">
                    <Sparkles className="text-primary-kinetic w-6 h-6" />
                  </div>
                  <h4 className="font-headline font-bold uppercase tracking-tight">AI Narrative Synthesis</h4>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-900/80 rounded-lg border-l-4 border-primary-kinetic">
                    <p className="text-sm font-medium italic text-zinc-400">"Today's data suggests a significant breakthrough in Mindset resilience. Your 45-minute deep work session coincided with peak heart rate variability..."</p>
                  </div>
                  <div className="h-4 w-3/4 bg-white/5 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-white/5 rounded-full"></div>
                  <div className="h-4 w-2/3 bg-white/5 rounded-full"></div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-4 md:-right-10 w-48 md:w-64 h-48 md:h-64 glass-panel rounded-xl border border-white/5 p-6 shadow-2xl overflow-hidden hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Career Trajectory</p>
                <div className="flex items-end gap-2 h-32 pt-4">
                  {[30, 50, 40, 70, 90, 85].map((h, i) => (
                    <div key={i} className="w-1/6 bg-primary-kinetic/40 rounded-sm" style={{ height: `${h}%`, opacity: (i + 1) / 6 }}></div>
                  ))}
                </div>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary-kinetic font-black tracking-[0.5em] uppercase text-xs mb-6 block">Future of Identity</span>
              <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-tight">AI-Powered <br/>Narrative Resumes</h2>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                Stop recording static history. Our AI engine transforms your daily deeds, from spiritual practices to performance habits, into a living <span className="text-white font-bold">Personal Evolution Summary</span>. 
              </p>
              <ul className="space-y-6 mb-12 text-zinc-300">
                {[
                  'Automated Deed Categorization',
                  'Data-Driven Growth Narratives',
                  'Skillset Evolution Tracking'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary-kinetic/10 flex items-center justify-center text-primary-kinetic text-xs">✓</div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="border-b border-primary-kinetic text-primary-kinetic pb-2 font-headline font-bold uppercase tracking-widest text-sm hover:text-white hover:border-white transition-all"
              >
                Learn more about Synthesis
              </button>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="py-32 px-6 md:px-12 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute inset-0 kinetic-grid opacity-20"></div>
          <div className="text-center mb-20 relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4">Progress at a Glance</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Your kinetic dashboard is a high-fidelity window into your personal growth telemetry.</p>
          </div>
          <div className="max-w-6xl mx-auto relative group z-10 px-4 md:px-0">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-kinetic/10 via-secondary-kinetic/10 to-error-kinetic/10 opacity-40 blur-3xl group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row min-h-[500px]">
              {/* Sidebar Mirror */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-8 bg-zinc-900/50 flex flex-col gap-8">
                <Logo size={40} className="w-10 h-10" />
                <nav className="space-y-6">
                  <div className="flex items-center gap-4 opacity-100">
                    <div className="w-2 h-2 rounded-full bg-primary-kinetic shadow-[0_0_8px_#a5a5ff]"></div>
                    <div className="h-2 w-24 bg-white/40 rounded"></div>
                  </div>
                  {[20, 28, 24].map((w, i) => (
                    <div key={i} className="flex items-center gap-4 opacity-40">
                      <div className="w-2 h-2 rounded-full bg-white/20"></div>
                      <div className="h-2 bg-white/20 rounded" style={{ width: `${w * 4}px` }}></div>
                    </div>
                  ))}
                </nav>
              </div>
              {/* Main Area */}
              <div className="flex-1 bg-zinc-900/20 p-8 md:p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter mb-2">Statistics</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Analyze your journey and growth</p>
                  </div>
                  <div className="flex gap-2 p-1 bg-black/40 rounded-full border border-white/5 h-fit">
                    <span className="px-4 py-1 text-[8px] md:text-[10px] font-bold uppercase rounded-full">Day</span>
                    <span className="px-4 py-1 text-[8px] md:text-[10px] font-bold uppercase rounded-full bg-primary-kinetic text-on-primary">Week</span>
                  </div>
                </div>
                {/* Visuals */}
                <div className="bg-zinc-900/80 rounded-2xl border border-white/5 p-8 mb-8 h-[250px] relative">
                  <div className="flex items-end justify-between h-full px-4 gap-4">
                    {[5, 8, 4, 12, 6, 10, 90].map((h, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-12 rounded-t-sm transition-all duration-1000",
                          i === 6 ? "bg-primary-kinetic shadow-[0_0_20px_#a5a5ff30]" : "bg-white/5 h-[10px]"
                        )} 
                        style={{ height: i === 6 ? '90%' : `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO/Trust Quote */}
        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <span className="material-symbols-outlined text-primary-kinetic text-6xl mb-8 opacity-20 block mx-auto underline">"</span>
            <p className="font-headline text-3xl md:text-4xl italic text-white leading-snug mb-12">
              "QUEST isn't just a tracker; it's a sophisticated architectural blueprint for <span className="text-primary-kinetic">Holistic Excellence</span>. It bridges the gap between <span className="text-secondary-kinetic">Spiritual Growth</span> and <span className="text-tertiary-kinetic">Data-Driven Self-Improvement</span>."
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40">
              {['Habit Tracking', 'Mental Resilience', 'Scientific Method', 'Kinetic Flow'].map(t => (
                <span key={t} className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase">{t}</span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 w-full py-20 border-t border-white/5 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <Logo size={32} className="w-8 h-8" />
              <span className="text-lg font-black text-white font-headline uppercase tracking-tighter">QUEST</span>
            </div>
            <p className="font-body text-xs tracking-widest uppercase text-zinc-500">© 2024 QUEST. ENTER THE KINETIC VAULT.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-8 md:gap-12">
            {[
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms of Service' },
              { to: '/scientific-method', label: 'Scientific Method' },
              { to: '/contact', label: 'Contact' }
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to}
                className="font-body text-sm tracking-widest uppercase text-zinc-500 hover:text-primary-kinetic transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
