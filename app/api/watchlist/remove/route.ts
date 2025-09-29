// app/api/watchlist/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // Get the current user from Supabase (authenticated)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
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
