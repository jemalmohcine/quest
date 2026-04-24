import { NextResponse } from 'next/server';

/** Santé de l’API Next (load balancers, monitoring). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'quest-web',
    ts: new Date().toISOString(),
  });
}
