import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Fetch the shoe by slug
    const { data: shoe, error: shoeError } = await supabase
      .from('shoes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (shoeError || !shoe) {
      return NextResponse.json({ error: 'Shoe not found' }, { status: 404 });
    }

    // Fetch the latest price data for this shoe
    const { data: latestPrice, error: priceError } = await supabase
      .from('prices')
      .select('price, original_price, discount_percentage, date, retailer_id')
      .eq('shoe_id', shoe.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (priceError && priceError.code !== 'PGRST116') {
      console.error('Error fetching latest price:', priceError);
    }

    // Fetch all price history for this shoe (for potential future use)
    const { data: priceHistory, error: historyError } = await supabase
      .from('prices')
      .select('price, original_price, discount_percentage, date, retailer_id')
      .eq('shoe_id', shoe.id)
      .order('date', { ascending: false })
      .limit(30); // Last 30 price entries

    if (historyError) {
      console.error('Error fetching price history:', historyError);
    }

    return NextResponse.json({
      shoe: {
        ...shoe,
        latestPrice: latestPrice || null,
        priceHistory: priceHistory || []
      }
    });

  } catch (error) {
    console.error('Error fetching shoe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}