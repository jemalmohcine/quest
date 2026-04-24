import { NextResponse } from 'next/server';

/** Version structurée pour clients / intégrations. */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    api: 'v1',
    environment: process.env.NODE_ENV ?? 'development',
  });
}
