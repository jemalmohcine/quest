import { clientApiUrl } from '@/lib/client-api-url';
import type { DeedCreateInput } from '@/lib/schemas/deed';
import type { ProfileUpsertBody } from '@/lib/schemas/profile';
import type { WeeklyResumePutBody } from '@/lib/schemas/weekly-resume';

export type QuestHttpError = { message: string };

type Json = Record<string, unknown>;

async function parseJson(res: Response): Promise<Json> {
  try {
    return (await res.json()) as Json;
  } catch {
    return {};
  }
}

function errMessage(json: Json, fallback: string): string {
  const e = json.error;
  if (typeof e === 'string') return e;
  const m = json.message;
  if (typeof m === 'string') return m;
  return fallback;
}

/** Client API `/api/v1/*` — session Supabase via cookies (même origine). */
export const questHttp = {
  async getProfile(): Promise<{ data: unknown; error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl('/api/v1/profile'), { credentials: 'same-origin' });
    const json = await parseJson(res);
    if (!res.ok) return { data: null, error: { message: errMessage(json, res.statusText) } };
    return { data: json.data ?? null, error: null };
  },

  async putProfile(body: ProfileUpsertBody): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl('/api/v1/profile'), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },

  async listDeeds(params?: {
    date?: string;
    since?: string;
    from?: string;
    to?: string;
    recent?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; error: QuestHttpError | null }> {
    const sp = new URLSearchParams();
    if (params?.date) sp.set('date', params.date);
    if (params?.since) sp.set('since', params.since);
    if (params?.from) sp.set('from', params.from);
    if (params?.to) sp.set('to', params.to);
    if (params?.recent != null) sp.set('recent', String(params.recent));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    const q = sp.toString();
    const res = await fetch(clientApiUrl(`/api/v1/deeds${q ? `?${q}` : ''}`), { credentials: 'same-origin' });
    const json = await parseJson(res);
    if (!res.ok) return { data: [], error: { message: errMessage(json, res.statusText) } };
    const rows = json.data;
    return { data: Array.isArray(rows) ? rows : [], error: null };
  },

  async createDeed(body: DeedCreateInput): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl('/api/v1/deeds'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },

  async updateDeed(id: string, patch: Json): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl(`/api/v1/deeds/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },

  async deleteDeed(id: string): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl(`/api/v1/deeds/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },

  async deleteAllDeeds(): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl('/api/v1/deeds?purge=all'), {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },

  async getWeeklyResume(weekId: string): Promise<{ data: unknown; error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl(`/api/v1/weekly-resumes/${encodeURIComponent(weekId)}`), {
      credentials: 'same-origin',
    });
    const json = await parseJson(res);
    if (!res.ok) return { data: null, error: { message: errMessage(json, res.statusText) } };
    return { data: json.data ?? null, error: null };
  },

  async putWeeklyResume(weekId: string, body: WeeklyResumePutBody): Promise<{ error: QuestHttpError | null }> {
    const res = await fetch(clientApiUrl(`/api/v1/weekly-resumes/${encodeURIComponent(weekId)}`), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await parseJson(res);
    if (!res.ok) return { error: { message: errMessage(json, res.statusText) } };
    return { error: null };
  },
};
