import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    const response = NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  if (!user || typeof user === 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: currentPassword, error: password_error } = await supabase
    .from('users')
    .select('password')
    .eq('id', user.id)
    .single();

  if (password_error) {
    return NextResponse.json({ error: password_error.message }, { status: 500 });
  }

  const { old_pw, new_pw } = await req.json();

  const validPassword = await bcrypt.compare(old_pw, currentPassword.password);

  if (!validPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const hashedPassword = await bcrypt.hash(new_pw, 10);

  const { data: currentUser, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Password updated' }, { status: 200 });
}
