import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { questHttp } from '@/services/quest-http';
import type { ProfileUpsertBody } from '@/lib/schemas/profile';
import { profileRowToUserProfile, userProfileToUpsertRow } from '@/lib/quest-mappers';
import { UserProfile } from '@/types';
import { translations, TranslationKey } from '@/lib/translations';
import { applyDomTheme, persistTheme } from '@/lib/theme-preference';

interface QuestContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  t: (key: TranslationKey) => string;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

function defaultProfile(_id: string, email: string, nameHint: string): UserProfile {
  return {
    email,
    name: nameHint || 'User',
    createdAt: new Date().toISOString(),
    language: 'en',
    theme: 'system',
    dailyObjective: 5,
    objectivePerPillar: {
      soulset: 1,
      healthset: 1,
      mindset: 1,
      skillset: 1,
      heartset: 1,
    },
    customFeelings: [],
  };
}

export function QuestProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrCreateProfile = useCallback(async (u: SupabaseUser) => {
    if (!getSupabaseClient()) {
      setProfile(null);
      return;
    }
    const { data, error } = await questHttp.getProfile();
    if (error) {
      console.error('[quest] profile load', error);
      setProfile(null);
      return;
    }
    if (!data) {
      const meta = u.user_metadata as { name?: string; full_name?: string } | undefined;
      const name =
        (typeof meta?.full_name === 'string' && meta.full_name) ||
        (typeof meta?.name === 'string' && meta.name) ||
        u.email?.split('@')[0] ||
        'User';
      const base = defaultProfile(u.id, u.email ?? '', name);
      const row = userProfileToUpsertRow(u.id, u.email ?? '', base);
      const { error: insErr } = await questHttp.putProfile({
        name: row.name,
        language: row.language === 'fr' ? 'fr' : 'en',
        theme: row.theme === 'dark' || row.theme === 'light' || row.theme === 'system' ? row.theme : 'system',
        daily_objective: row.daily_objective,
        objective_per_pillar: row.objective_per_pillar as ProfileUpsertBody['objective_per_pillar'],
        custom_feelings: row.custom_feelings ?? [],
        photo_url: row.photo_url ?? undefined,
      });
      if (insErr) {
        console.error('[quest] profile insert', insErr);
        setProfile(base);
        return;
      }
      setProfile(base);
      return;
    }
    setProfile(profileRowToUserProfile(data as Parameters<typeof profileRowToUserProfile>[0]));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadOrCreateProfile(user);
  }, [user, loadOrCreateProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        void loadOrCreateProfile(sessionUser).catch((e) => console.error('[quest] profile init', e));
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    void init();

    // Sync callback: GoTrue awaits all onAuthStateChange handlers before resolving signInWithPassword.
    // If we await loadOrCreateProfile here, a stuck /profiles request blocks login forever (spinner).
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      if (next) {
        void loadOrCreateProfile(next).catch((e) => console.error('[quest] profile after auth', e));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    const subscription = (authListener as { data: { subscription: { unsubscribe: () => void } } }).data.subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [loadOrCreateProfile]);

  useEffect(() => {
    if (!profile) return;

    const theme = profile.theme || 'system';
    persistTheme(theme);
    applyDomTheme(theme);

    if (profile.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyDomTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [profile?.theme]);

  const t = (key: TranslationKey): string => {
    const lang = profile?.language || 'en';
    return translations[lang][key] || translations['en'][key] || key;
  };

  const signIn = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase non configuré');
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    if (data.url) window.location.assign(data.url);
  };

  const signInEmail = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase non configuré');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase non configuré');
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, full_name: name }, emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase non configuré');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/app`,
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut();
    } catch (e) {
      console.error('[quest] signOut', e);
    }
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    if (!getSupabaseClient()) return;
    const current = profile ?? defaultProfile(user.id, user.email ?? '', user.email?.split('@')[0] ?? 'User');
    const merged: UserProfile = {
      ...current,
      ...updates,
      objectivePerPillar: {
        ...current.objectivePerPillar,
        ...(updates.objectivePerPillar ?? {}),
      },
      customFeelings: updates.customFeelings ?? current.customFeelings,
    };
    if (updates.theme) {
      persistTheme(updates.theme);
      applyDomTheme(updates.theme);
    }
    const row = userProfileToUpsertRow(user.id, merged.email || user.email || '', merged);
    const { error } = await questHttp.putProfile({
      name: row.name,
      language: row.language === 'fr' ? 'fr' : 'en',
      theme: row.theme === 'dark' || row.theme === 'light' || row.theme === 'system' ? row.theme : 'system',
      daily_objective: row.daily_objective,
      objective_per_pillar: row.objective_per_pillar as ProfileUpsertBody['objective_per_pillar'],
      custom_feelings: row.custom_feelings ?? [],
      photo_url: row.photo_url ?? undefined,
    });
    if (error) {
      console.error('[quest] profile update', error);
      throw new Error(error.message);
    }
    setProfile(merged);
  };

  return (
    <QuestContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signInEmail,
        signUpEmail,
        resetPassword,
        logout,
        updateProfile,
        refreshProfile,
        t,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}

export function useQuest() {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuest must be used within a QuestProvider');
  }
  return context;
}

/** @deprecated use useQuest */
export const useFirebase = useQuest;
