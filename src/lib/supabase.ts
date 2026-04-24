/**
 * Client navigateur uniquement — utilisé par les composants client existants.
 * Préférer `createClient` depuis `@/lib/supabase/client` dans le nouveau code.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!browserClient) browserClient = createClient();
    return browserClient;
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[quest] Supabase indisponible — vérifie NEXT_PUBLIC_SUPABASE_* dans .env.local');
    }
    return null;
  }
}
