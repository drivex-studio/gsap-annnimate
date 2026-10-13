import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

export async function getViewerContext() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, hasAccess: false, savedIds: [] };

  const [{ data: profile }, { data: saved }] = await Promise.all([
    supabase.from('users').select('has_access').eq('id', user.id).maybeSingle(),
    supabase.from('saved_animations').select('animation_id').eq('user_id', user.id),
  ]);

  return {
    user,
    hasAccess: !!profile?.has_access,
    savedIds: (saved ?? []).map((row) => row.animation_id),
  };
}
