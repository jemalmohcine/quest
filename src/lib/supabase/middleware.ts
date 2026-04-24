import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const LEGACY_MARKETING_SINGLE = new Set(['contact', 'privacy', 'terms', 'scientific-method']);

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/app';
  // Utilisateur déjà connecté : ne pas renvoyer vers la publique ou le login
  if (raw === '/' || raw === '/login' || raw === '/fr' || raw === '/en') return '/app';
  return raw;
}

/** Les redirections doivent reprendre les Set-Cookie du refresh session, sinon l’utilisateur semble déconnecté. */
function withSessionCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '') ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[middleware] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant — auth ignorée');
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch (e) {
    console.error('[middleware] getUser', e);
  }

  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = '/login';
    redirectTo.searchParams.set('next', request.nextUrl.pathname);
    return withSessionCookies(supabaseResponse, NextResponse.redirect(redirectTo));
  }

  const pathname = request.nextUrl.pathname;
  const isLocaleHome = pathname === '/fr' || pathname === '/en';

  if (user && (pathname === '/' || isLocaleHome)) {
    return withSessionCookies(supabaseResponse, NextResponse.redirect(new URL('/app', request.url)));
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1 && LEGACY_MARKETING_SINGLE.has(segments[0])) {
    return withSessionCookies(
      supabaseResponse,
      NextResponse.redirect(new URL(`/fr/${segments[0]}`, request.url)),
    );
  }

  if (pathname === '/' && !user) {
    return withSessionCookies(supabaseResponse, NextResponse.redirect(new URL('/fr', request.url)));
  }

  if (request.nextUrl.pathname === '/login' && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get('next'));
    return withSessionCookies(supabaseResponse, NextResponse.redirect(new URL(next, request.url)));
  }

  return supabaseResponse;
}
