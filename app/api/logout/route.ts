import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db';

export async function POST() {
  try {
    const supabase = createServerClient();

    // Sign out user from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully logged out' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}