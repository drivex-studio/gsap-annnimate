import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, website } = body;

    if (website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: dbError } = await supabase
      .from('subscribers')
      .insert([{ email }]);

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ success: true }, { status: 200 });
      }
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
