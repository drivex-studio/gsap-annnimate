import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { animationId } = await request.json();

    if (!animationId) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: dbError } = await supabase
      .from('animation_views')
      .insert([{ animation_id: animationId }]);

    if (dbError) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
