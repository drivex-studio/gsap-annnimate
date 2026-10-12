import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event, ...payload } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        }
      }
    );

    const { error: dbError } = await supabaseAdmin
      .from('user_events')
      .insert([
        {
          user_id: user ? user.id : null,
          event_name: event,
          event_data: payload
        }
      ]);

    if (dbError) {
      console.error('Events DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
