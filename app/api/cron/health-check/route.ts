import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🏥 Starting health check...');
    
    const healthStatus = {
      database: { connected: false, error: null as string | null },
      retailers: { enabled: 0, total: 0, error: null as string | null },
      environment: { cronSecret: !!process.env.CRON_SECRET, supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      const { error } = await supabase
        .from('retailers')
        .select('id, enabled, last_scraped')
        .limit(1);

      if (error) {
        healthStatus.database.error = error.message;
        console.error('💥 Database connection failed:', error);
      } else {
        healthStatus.database.connected = true;
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      healthStatus.database.error = error instanceof Error ? error.message : 'Unknown database error';
      console.error('💥 Database connection error:', error);
    }

    // Check retailer configuration
    try {
      const { data: retailers, error } = await supabase
        .from('retailers')
        .select('id, enabled, name');

      if (error) {
        healthStatus.retailers.error = error.message;
        console.error('💥 Failed to fetch retailers:', error);
      } else {
        healthStatus.retailers.total = retailers?.length || 0;
        healthStatus.retailers.enabled = retailers?.filter(r => r.enabled).length || 0;
        console.log(`✅ Retailers check: ${healthStatus.retailers.enabled}/${healthStatus.retailers.total} enabled`);
      }
    } catch (error) {
      healthStatus.retailers.error = error instanceof Error ? error.message : 'Unknown retailers error';
      console.error('💥 Retailers check error:', error);
    }

    // Check recent scraping activity
    const recentActivity = { lastScraped: null as string | null, productsCount: 0, pricesCount: 0 };
    try {
      const { data: lastScraped } = await supabase
        .from('retailers')
        .select('last_scraped')
        .eq('id', 'sportsshoes')
        .maybeSingle();

      const { count: productsCount } = await supabase
        .from('shoes')
        .select('*', { count: 'exact', head: true });

      const { count: pricesCount } = await supabase
        .from('prices')
        .select('*', { count: 'exact', head: true });

      recentActivity.lastScraped = lastScraped?.last_scraped || null;
      recentActivity.productsCount = productsCount || 0;
      recentActivity.pricesCount = pricesCount || 0;

      console.log(`📊 Recent activity: Last scraped: ${recentActivity.lastScraped}, Products: ${recentActivity.productsCount}, Prices: ${recentActivity.pricesCount}`);
    } catch (error) {
      console.error('💥 Recent activity check error:', error);
    }

    // Determine overall health status
    const isHealthy = healthStatus.database.connected && 
                     healthStatus.retailers.enabled > 0 && 
                     healthStatus.environment.cronSecret && 
                     healthStatus.environment.supabaseUrl;

    const statusCode = isHealthy ? 200 : 500;
    const statusMessage = isHealthy ? 'Health check passed' : 'Health check failed';

    console.log(`✅ Health check completed: ${statusMessage}`);

    return NextResponse.json({
      success: isHealthy,
      status: statusMessage,
      health: healthStatus,
      recentActivity,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
    
  } catch (error) {
    console.error('💥 Health check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
