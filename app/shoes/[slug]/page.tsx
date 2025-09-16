import { supabase } from '@/lib/db';
import { notFound } from 'next/navigation';

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
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{shoe.brand} {shoe.model}</h1>
        <p className="mt-2 text-sm text-gray-600">Price: $IDK</p>
      </div>
    </main>
  );
}

// Every 24 hours (86400 seconds)
export const revalidate = 86400;
