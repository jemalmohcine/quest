import { LegalPage } from './Privacy';
import { Mail, Shield, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export function Contact({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Contact the Vault" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
        <div className="space-y-8">
          <p className="text-xl text-zinc-400 font-medium leading-relaxed">
            Have questions about the Protocol or the Kinetic Vault? Reach out to our neural core specialists.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <span className="font-bold">hello@quest.app</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold">Encrypted & Secure</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Name</label>
            <Input className="h-14 bg-white/5 border-white/10" placeholder="John Doe" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Email</label>
            <Input className="h-14 bg-white/5 border-white/10" placeholder="john@example.com" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Message</label>
            <Textarea className="min-h-[150px] bg-white/5 border-white/10" placeholder="How can we help?" />
          </div>
          <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02]">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </LegalPage>
  );
}
