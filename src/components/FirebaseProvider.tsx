import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, onSnapshot, setDoc, Timestamp, FirebaseUser } from '../lib/firebase';
import { UserProfile } from '../types';
import { translations, TranslationKey } from '../lib/translations';

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  t: (key: TranslationKey) => string;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Initialize profile if it doesn't exist
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              createdAt: Timestamp.now(),
              language: 'en',
              theme: 'system',
              dailyObjective: 5,
              objectivePerPillar: {
                soulset: 1,
                healthset: 1,
                mindset: 1,
                skillset: 1,
                heartset: 1
              }
            };
            setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme(profile.theme || 'system');

    // Listen for system theme changes if theme is 'system'
    if (profile.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [profile?.theme]);

  const t = (key: TranslationKey): string => {
    const lang = profile?.language || 'en';
    return translations[lang][key] || translations['en'][key] || key;
  };

  const signIn = async () => {
    const { signInWithPopup, googleProvider } = await import('../lib/firebase');
    await signInWithPopup(auth, googleProvider);
  };

  const signInEmail = async (email: string, pass: string) => {
    const { signInWithEmailAndPassword } = await import('../lib/firebase');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('../lib/firebase');
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
  };

  const resetPassword = async (email: string) => {
    const { sendPasswordResetEmail } = await import('../lib/firebase');
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    const { signOut } = await import('../lib/firebase');
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, signIn, signInEmail, signUpEmail, resetPassword, logout, t }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
