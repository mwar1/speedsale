import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  
  // Get the current user from Supabase (authenticated)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const response = NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const { old_pw, new_pw } = await req.json();

  if (!old_pw || !new_pw) {
    return NextResponse.json({ error: 'Old password and new password are required' }, { status: 400 });
  }

  // Use Supabase Auth to update password
  const { error } = await supabase.auth.updateUser({
    password: new_pw
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Password updated' }, { status: 200 });
}
