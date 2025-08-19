import { supabase } from '@/lib/db';
import { notFound } from 'next/navigation';
import { use } from 'react';

interface PageProps {
  params: { slug: string };
}

export default async function ShoePage({params}: {params: Promise<{ slug: string }>}) {
  const { slug } = await params;

  const { data: shoe, error } = await supabase
    .from('shoes')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!shoe || error) {
    return notFound();
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{shoe.brand} {shoe.model}</h1>
      <p>Price: ${shoe.price}</p>
    </main>
  );
}

// Every 24 hours (86400 seconds)
export const revalidate = 86400;
