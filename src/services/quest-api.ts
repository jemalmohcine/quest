import type { SupabaseClient } from '@supabase/supabase-js';

type SB = SupabaseClient;

/** Row shapes match `quest-new/supabase/schema.sql` */
export const questApi = {
  async getProfile(supabase: SB, userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  },

  async upsertProfile(
    supabase: SB,
    profile: {
      id: string;
      email: string;
      name: string;
      language?: string;
      theme?: string;
      daily_objective?: number;
      objective_per_pillar?: Record<string, number>;
      custom_feelings?: string[];
      photo_url?: string | null;
    },
  ) {
    return supabase.from('profiles').upsert(profile, { onConflict: 'id' });
  },

  async listDeeds(supabase: SB, userId: string) {
    return supabase.from('deeds').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  async listDeedsLimited(supabase: SB, userId: string, limit: number) {
    return supabase
      .from('deeds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async listDeedsSinceDate(supabase: SB, userId: string, dateYmd: string) {
    return supabase
      .from('deeds')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateYmd)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
  },

  async listDeedsForDateRange(supabase: SB, userId: string, startYmd: string, endYmd: string) {
    return supabase
      .from('deeds')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startYmd)
      .lte('date', endYmd)
      .order('date', { ascending: true });
  },

  async listDeedsForDay(supabase: SB, userId: string, dateYmd: string) {
    return supabase.from('deeds').select('*').eq('user_id', userId).eq('date', dateYmd);
  },

  async listRecentDeeds(supabase: SB, userId: string, limit: number) {
    return supabase
      .from('deeds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async createDeed(supabase: SB, deed: Record<string, unknown>) {
    return supabase.from('deeds').insert(deed);
  },

  async updateDeed(supabase: SB, id: string, updates: Record<string, unknown>) {
    return supabase.from('deeds').update(updates).eq('id', id);
  },

  async updateDeedForUser(supabase: SB, userId: string, id: string, updates: Record<string, unknown>) {
    return supabase.from('deeds').update(updates).eq('id', id).eq('user_id', userId);
  },

  async deleteDeed(supabase: SB, id: string) {
    return supabase.from('deeds').delete().eq('id', id);
  },

  async deleteDeedForUser(supabase: SB, userId: string, id: string) {
    return supabase.from('deeds').delete().eq('id', id).eq('user_id', userId);
  },

  async deleteAllDeeds(supabase: SB, userId: string) {
    return supabase.from('deeds').delete().eq('user_id', userId);
  },

  async getWeeklyResume(supabase: SB, userId: string, weekId: string) {
    return supabase.from('weekly_resumes').select('*').eq('user_id', userId).eq('week_id', weekId).maybeSingle();
  },

  async upsertWeeklyResume(
    supabase: SB,
    payload: { user_id: string; week_id: string; narrative: string; audio_base64?: string | null },
  ) {
    return supabase.from('weekly_resumes').upsert(payload, { onConflict: 'user_id,week_id' });
  },
};
