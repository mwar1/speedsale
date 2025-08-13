import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// This needs changing
export async function POST(req: Request) {
  // const { shoeName, userEmail } = await req.json();

  const { data, error } = await supabase
    .from('shoes')
    .insert([{ brand: "BRAND", model: "MODEL" }])

  return NextResponse.json({ data, error });
}
