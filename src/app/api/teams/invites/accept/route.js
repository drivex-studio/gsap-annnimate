import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.redirect(new URL('/animations?error=Missing invite ID', request.url));
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', `/api/teams/invites/accept?id=${inviteId}`);
      return NextResponse.redirect(loginUrl);
    }

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: { getAll() { return [] }, setAll() {} }
      }
    );

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.redirect(new URL('/animations?error=Invalid or expired invite', request.url));
    }

    if (invite.email !== user.email) {
      return NextResponse.redirect(new URL('/animations?error=Please log in with the invited email', request.url));
    }

    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .upsert({
        team_id: invite.team_id,
        user_id: user.id,
        role: invite.role
      });

    if (memberError) {
      return NextResponse.redirect(new URL('/animations?error=Failed to join team', request.url));
    }

    await supabaseAdmin
      .from('team_invites')
      .delete()
      .eq('id', inviteId);

    return NextResponse.redirect(new URL('/animations?success=Joined team', request.url));
    
  } catch (error) {
    console.error('Accept Invite Error:', error);
    return NextResponse.redirect(new URL('/animations?error=Internal Server Error', request.url));
  }
}
