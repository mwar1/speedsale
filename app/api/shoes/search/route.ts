// app/api/shoes/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim() || '';

  let query = supabase.from('shoes').select('*');

  if (search.length > 0) {
    const terms = search.split(/\s+/);
    terms.forEach((term) => {
      query = query.or(`brand.ilike.${term}%,model.ilike.${term}%`);
    });
  }

  const { data: shoes, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ shoes });
}
