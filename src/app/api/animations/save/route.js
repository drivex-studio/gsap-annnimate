import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthSupabase() {
  const cookieStore = await cookies();
  
  return createServerClient(
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
}

export async function POST(request) {
  try {
    const supabase = await getAuthSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animationId } = await request.json();

    if (!animationId) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('saved_animations')
      .insert([{ user_id: user.id, animation_id: animationId }]);

    if (dbError && dbError.code !== '23505') {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await getAuthSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { animationId } = await request.json();

    if (!animationId) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('saved_animations')
      .delete()
      .match({ user_id: user.id, animation_id: animationId });

    if (dbError) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
