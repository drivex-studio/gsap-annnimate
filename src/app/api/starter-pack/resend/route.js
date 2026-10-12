import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); 

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to resend.' }, { status: 401 });
    }

    const { data, error: sendError } = await resend.emails.send({
      from: 'hello@updates.drivexstore.shop', 
      to: [user.email], 
      subject: 'Your Starter Pack from DriveX Store',
      html: `
        <p>Hey there,</p>
        <p>Here is your requested Starter Pack. Click the link below to download:</p>
        <p><a href="https://zrlqjscegqnwqsarvouj.supabase.co/storage/v1/object/public/starter-packs/annnimate-starter-pack.zip">Download Starter Pack</a></p>
        <p>Happy building!</p>
      `,
    });

    if (sendError) {
      console.error('Email Send Error:', sendError);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Starter pack has been resent to your email.' }, { status: 200 });
    
  } catch (error) {
    console.error('Starter Pack Resend Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
