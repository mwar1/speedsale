// app/api/profile/route.ts
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
    const { new_fname, new_sname } = body;

    if ( new_fname === undefined || new_sname === undefined || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
          fname: new_fname,
          sname: new_sname,
      })
      .eq('id', user_id);


    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, watchlist: data });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}