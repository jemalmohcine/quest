import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      supabase,
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized', message: 'Non autorisé' }, { status: 401 }),
    };
  }
  return { supabase, user, errorResponse: null };
}
