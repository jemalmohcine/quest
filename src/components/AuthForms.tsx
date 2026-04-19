import { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Loader2, Mail, Lock, User, ArrowLeft, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthForms({ onBack }: { onBack: () => void }) {
  const { signIn, signInEmail, signUpEmail, resetPassword, t } = useFirebase();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        await signInEmail(email, password);
      } else if (mode === 'signup') {
        await signUpEmail(email, password, name);
        setMessage(t('verifyEmailSent'));
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark">
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Kinetic Background elements */}
        <div className="absolute inset-0 kinetic-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-8 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full px-6 transition-all"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Vault
          </Button>

          <Card className="glass-panel border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-3xl">
            <CardHeader className="space-y-2 pb-8 text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter uppercase font-headline">
                {mode === 'signin' ? t('signIn') : mode === 'signup' ? t('signUp') : t('resetPassword')}
              </CardTitle>
              <CardDescription className="text-zinc-400 font-medium tracking-tight">
                {mode === 'signin' ? t('welcome') : mode === 'signup' ? 'Create your account to start your quest' : 'Enter your email to receive a reset link'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">{t('name')}</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                        <Input 
                          placeholder="John Doe" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={mode === 'signup'}
                          className="pl-11 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all text-white placeholder:text-zinc-700"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">{t('email')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                    <Input 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all text-white placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">{t('password')}</Label>
                      {mode === 'signin' && (
                        <button 
                          type="button"
                          onClick={() => setMode('reset')}
                          className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
                        >
                          {t('forgotPassword')}
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-11 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all text-white placeholder:text-zinc-700"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium"
                  >
                    {message}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95 hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? t('signIn') : mode === 'signup' ? t('signUp') : t('sendResetLink')}
                </Button>
              </form>

              {mode !== 'reset' && (
                <div className="mt-8 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]">
                      <span className="bg-zinc-900/50 px-4 text-zinc-500">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all text-white"
                  >
                    <Chrome className="mr-2 w-5 h-5" />
                    {t('googleSignIn')}
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className="pb-8 pt-4 justify-center">
              <button 
                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                {mode === 'signin' || mode === 'reset' ? t('dontHaveAccount') : t('alreadyHaveAccount')}
              </button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
