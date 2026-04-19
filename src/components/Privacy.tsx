import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface LegalPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function LegalPage({ title, onBack, children }: LegalPageProps) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans selection:bg-indigo-500 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 kinetic-grid opacity-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-zinc-500 hover:text-white hover:bg-white/5 flex items-center gap-2 px-4 -ml-4 rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quest
          </Button>

        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">
            {title}
          </h1>
          <div className="h-1 w-20 bg-indigo-600 rounded-full" />
        </header>

        <div className="prose prose-invert prose-zinc max-w-none prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-xs prose-h2:font-black prose-h2:text-indigo-400">
          {children}
        </div>
      </div>
    </div>
  </div>
  );
}

export function Privacy({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Privacy Policy" onBack={onBack}>
      <section>
        <h2>Data Protection</h2>
        <p>At QUEST, we prioritize your cognitive and personal data sovereignty. We collect minimal data required to power your Personal Evolution Summary and Narrative Synthesis.</p>
        
        <h2>Information Harvesting</h2>
        <p>We receive information stored in your local kinetic vault, including your daily deeds, pillar distribution, and narrative summaries. This data is encrypted and used solely for your personal growth tracking.</p>
        
        <h2>Third-Party Synthesis</h2>
        <p>Our AI Narrative Synthesis uses Google's Gemini models. Data sent for synthesis is abstracted to protect your identity and is not used for model training purposes.</p>
        
        <h2>Your Rights</h2>
        <p>You have the absolute right to download your kinetic data, purge your vault, or disconnect from the neural core at any time.</p>
      </section>
    </LegalPage>
  );
}
