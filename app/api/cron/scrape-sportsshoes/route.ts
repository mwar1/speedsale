import { NextRequest, NextResponse } from 'next/server';
import { ScraperManager } from '@/lib/scraping/scraper-manager';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🏃 Starting SportsShoes scraping job...');
    
    const scraperManager = new ScraperManager();
    const result = await scraperManager.scrapeRetailer('sportsshoes', 'running');
    
    console.log(`✅ SportsShoes scraping completed: ${result.productsFound} found, ${result.productsSaved} saved`);
    
    return NextResponse.json({
      success: true,
      retailer: 'sportsshoes',
      category: 'running',
      productsFound: result.productsFound,
      productsSaved: result.productsSaved,
      errors: result.errors,
      duration: result.duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 SportsShoes scraping failed:', error);
    return NextResponse.json({
      success: false,
      retailer: 'sportsshoes',
      category: 'running',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
