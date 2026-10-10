import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ tier: null, country: null });
}
