import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
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
}
