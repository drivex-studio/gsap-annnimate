import { NextResponse } from 'next/server';

const TIER_2 = ['IN', 'ID', 'PH', 'VN', 'TH', 'MY', 'BR', 'MX', 'ZA'];
const TIER_3 = ['MM', 'BD', 'PK', 'NG', 'KE', 'LK', 'NP'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || request.headers.get('x-vercel-ip-country') || 'US';

    let tier = 'T1';
    if (TIER_2.includes(country)) {
      tier = 'T2';
    } else if (TIER_3.includes(country)) {
      tier = 'T3';
    }

    return NextResponse.json({ tier, country }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('PPP Geo Error:', error);
    return NextResponse.json({ tier: 'T1', country: 'US' }, { status: 200 });
  }
}
