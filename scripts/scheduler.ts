#!/usr/bin/env tsx

import cron from 'node-cron';
import { ScraperManager } from '../lib/scraping/scraper-manager';

class ScrapingScheduler {
  private scraperManager: ScraperManager;
  private isRunning: boolean = false;

  constructor() {
    this.scraperManager = new ScraperManager();
  }

  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Speed Sale Scraping Scheduler...\n');

    // Run scraping every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Starting scheduled scraping...');
      try {
        const results = await this.scraperManager.scheduleScrapingJobs();
        this.logScrapingResults(results);
      } catch (error) {
        console.error('💥 Scheduled scraping failed:', error);
      }
    });

    // Run price analysis and alerts every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('📊 Starting price analysis...');
      try {
        await this.analyzePricesAndSendAlerts();
        console.log('✅ Price analysis completed');
      } catch (error) {
        console.error('💥 Price analysis failed:', error);
      }
    });

    // Run a quick health check every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🏥 Running health check...');
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('💥 Health check failed:', error);
      }
    });

    this.isRunning = true;
    console.log('✅ Scheduler started successfully');
    console.log('📅 Jobs scheduled:');
    console.log('   - Scraping: Every 6 hours');
    console.log('   - Price Analysis: Every 12 hours');
    console.log('   - Health Check: Every hour');
    console.log('\nPress Ctrl+C to stop the scheduler\n');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping scheduler...');
    this.isRunning = false;
    console.log('✅ Scheduler stopped');
  }

  private logScrapingResults(results: any[]): void {
    console.log('\n📊 Scraping Results:');
    console.log(`   Jobs Processed: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
    console.log(`   Total Products: ${results.reduce((sum, r) => sum + r.productsFound, 0)}`);
    console.log(`   Products Saved: ${results.reduce((sum, r) => sum + r.productsSaved, 0)}`);

    if (results.length > 0) {
      console.log('\n📋 Individual Results:');
      for (const result of results) {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.retailerId}: ${result.productsFound} found, ${result.productsSaved} saved`);
        
        if (result.errors.length > 0) {
          result.errors.forEach((error: string) => console.log(`      - ${error}`));
        }
      }
    }
    console.log('');
  }

  private async analyzePricesAndSendAlerts(): Promise<void> {
    const { supabase } = await import('../lib/db');
    
    try {
      // Get users with watchlists
      const { data: watchlists, error } = await supabase
        .from('watchlists')
        .select(`
          *,
          shoes(*),
          users(*)
        `);

      if (error) {
        console.error('Error fetching watchlists:', error);
        return;
      }

      if (!watchlists || watchlists.length === 0) {
        console.log('📭 No watchlists found');
        return;
      }

      console.log(`📋 Analyzing ${watchlists.length} watchlists...`);

      let alertsSent = 0;

      for (const watchlist of watchlists) {
        if (!watchlist.shoes || !watchlist.users || !watchlist.shoe_id) continue;

        try {
          // Get latest prices for this shoe
          const { data: latestPrices, error: priceError } = await supabase
            .from('prices')
            .select('*')
            .eq('shoe_id', watchlist.shoe_id)
            .order('date', { ascending: false })
            .limit(2);

          if (priceError) {
            console.error(`Error fetching prices for shoe ${watchlist.shoe_id}:`, priceError);
            continue;
          }

          if (latestPrices && latestPrices.length >= 2) {
            const currentPrice = latestPrices[0].price;
            const previousPrice = latestPrices[1].price;
            
            // Skip if prices are null
            if (currentPrice === null || previousPrice === null) {
              continue;
            }
            
            const discountPercentage = ((previousPrice - currentPrice) / previousPrice) * 100;

            if (discountPercentage >= (watchlist.discount || 10)) {
              await this.sendPriceAlert(watchlist.users, watchlist.shoes, currentPrice, discountPercentage);
              alertsSent++;
            }
          }
        } catch (error) {
          console.error(`Error processing watchlist ${watchlist.id}:`, error);
        }
      }

      console.log(`📧 Sent ${alertsSent} price alerts`);
      
    } catch (error) {
      console.error('Error in price analysis:', error);
    }
  }

  private async sendPriceAlert(user: any, shoe: any, currentPrice: number, discountPercentage: number): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(`📧 Price alert for ${user.email}: ${shoe.model} is now £${currentPrice} (${discountPercentage.toFixed(1)}% off)`);
  }

  private async healthCheck(): Promise<void> {
    const { supabase } = await import('../lib/db');
    
    try {
      // Check database connection
      const { data, error } = await supabase
        .from('retailers')
        .select('id, enabled, last_scraped')
        .limit(1);

      if (error) {
        console.error('💥 Database health check failed:', error);
        return;
      }

      // Check if any retailers are enabled
      const enabledRetailers = data?.filter(r => r.enabled).length || 0;
      console.log(`🏥 Health check passed - ${enabledRetailers} retailers enabled`);

    } catch (error) {
      console.error('💥 Health check failed:', error);
    }
  }
}

// Main execution
async function main() {
  const scheduler = new ScrapingScheduler();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  // Start the scheduler
  scheduler.start();

  // Keep the process alive
  setInterval(() => {
    // Just keep the process running
  }, 1000);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

main().catch(console.error);
