// app/api/watchlist/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user_id = user.id;

    const body = await req.json();
    const { shoe_id, discount } = body;

    if (!shoe_id || discount === undefined || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('watchlists').insert([
      {
        shoe_id,
        discount,
        user_id,
      },
    ]);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, watchlist: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
