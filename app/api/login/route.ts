import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const supabase = await createClient();

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Set the session cookie for the client
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fname: authData.user.user_metadata?.fname,
        sname: authData.user.user_metadata?.sname,
      }
    });

    // Set the Supabase session cookies using the proper method
    const { error: cookieError } = await supabase.auth.setSession(authData.session);
    
    if (cookieError) {
      console.error('Failed to set session cookie:', cookieError);
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
