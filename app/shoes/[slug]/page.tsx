import { supabase } from '@/lib/db';
import { notFound } from 'next/navigation';
import ShoeImage from '@/components/ShoeImage';

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
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ShoeImage imageUrl={shoe.image_url} brand={shoe.brand} model={shoe.model} size="large" />
          </div>
          <div className="card p-8">
            <h1 className="text-3xl font-semibold tracking-tight">{shoe.brand} {shoe.model}</h1>
            <p className="mt-2 text-sm text-gray-600">Price: $IDK</p>
            {shoe.description && (
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-3">Description</h2>
                <p className="text-gray-700">{shoe.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Every 24 hours (86400 seconds)
export const revalidate = 86400;
