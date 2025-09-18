// app/api/watchlist/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookie = await cookies();
  const token = cookie.get('session')?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { shoe_id } = await req.json();

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', user.id)
    .eq('shoe_id', shoe_id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete from watchlist' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Successfully removed from watchlist' }, { status : 200 });
}
