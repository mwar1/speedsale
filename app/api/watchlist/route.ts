import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookie = await cookies();
  const token = cookie.get('session')?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { data: watchlist, error: watchlist_error } = await supabase
    .from('watchlists')
    .select('shoe_id')
    .eq('user_id', user.id);

  if (watchlist_error) throw watchlist_error;
  
  const shoeIds = watchlist
  .map((row) => row.shoe_id)
  .filter((id): id is string => id !== null);

  const { data: shoes, error } = await supabase
    .from('shoes')
    .select('*')
    .in('id', shoeIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ watchlist: shoes });
}
