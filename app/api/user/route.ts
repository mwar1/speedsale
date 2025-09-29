import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user from Supabase (authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json({ error: 'Not logged in' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // Get user data from your custom users table
    const { data: currentUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const response = NextResponse.json({ user: currentUser });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from Supabase (authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json({ error: 'Not logged in' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const { new_fname, new_sname, new_email } = await req.json();

    // Check if email is already in use by another user
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', new_email)
      .neq('id', user.id)
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingUsers?.length) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Update user data
    const { data: currentUser, error } = await supabase
      .from('users')
      .update({ fname: new_fname, sname: new_sname, email: new_email })
      .eq('id', user.id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update Supabase auth user metadata
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        fname: new_fname,
        sname: new_sname,
      }
    });

    if (updateAuthError) {
      console.error('Failed to update auth metadata:', updateAuthError);
      // Continue anyway since the main user data was updated
    }
  
    return NextResponse.json({ user: currentUser }, { status: 200 });
  } catch {
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
