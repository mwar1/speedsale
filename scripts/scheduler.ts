#!/usr/bin/env tsx

import 'dotenv-flow/config';
import cron from 'node-cron';
import { ScraperManager } from '../lib/scraping/scraper-manager';
import { EmailService } from '../lib/email-service';
import { supabase } from '@/lib/db';

class ScrapingScheduler {
  private scraperManager: ScraperManager;
  private emailService: EmailService;
  private isRunning: boolean = false;

  constructor() {
    this.scraperManager = new ScraperManager();
    this.emailService = new EmailService();
  }

  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting Speed Sale Scraping Scheduler...\n');

    // Run scraping every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Starting scheduled scraping...');
      try {
        const results = await this.scraperManager.scheduleScrapingJobs();
        this.logScrapingResults(results);
      } catch (error) {
        console.error('Scheduled scraping failed:', error);
      }
    });

    // Run price analysis and alerts every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('Starting price analysis...');
      try {
        await this.analysePricesAndSendAlerts();
        console.log('Price analysis completed');
      } catch (error) {
        console.error('Price analysis failed:', error);
      }
    });

    // Run a quick health check every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running health check...');
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    });

    this.isRunning = true;
    console.log('Scheduler started successfully');
    console.log('Jobs scheduled:');
    console.log('   - Scraping: Every 6 hours');
    console.log('   - Price Analysis: Every 12 hours');
    console.log('   - Health Check: Every hour');
    console.log('\nPress Ctrl+C to stop the scheduler\n');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping scheduler...');
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  private logScrapingResults(results: any[]): void {
    console.log('\nScraping Results:');
    console.log(`   Jobs Processed: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
    console.log(`   Total Products: ${results.reduce((sum, r) => sum + r.productsFound, 0)}`);
    console.log(`   Products Saved: ${results.reduce((sum, r) => sum + r.productsSaved, 0)}`);

    if (results.length > 0) {
      console.log('\nIndividual Results:');
      for (const result of results) {
        const status = result.success ? 'SUCCESS' : 'FAILED';
        console.log(`   ${status} ${result.retailerId}: ${result.productsFound} found, ${result.productsSaved} saved`);
        
        if (result.errors.length > 0) {
          result.errors.forEach((error: string) => console.log(`      - ${error}`));
        }
      }
    }
    console.log('');
  }

  private async analysePricesAndSendAlerts(): Promise<void> {
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
        console.log('No watchlists found');
        return;
      }

      console.log(`Analyzing ${watchlists.length} watchlists...`);

      let alertsSent = 0;
      let alertsSkipped = 0;

      for (const watchlist of watchlists) {
        if (!watchlist.shoes || !watchlist.users || !watchlist.shoe_id) continue;

        // Check if user has email notifications enabled
        const { data: userPreferences } = await supabase
          .from('user_preferences')
          .select('email_enabled')
          .eq('user_id', watchlist.users.id)
          .single();

        if (userPreferences?.email_enabled === false) {
          alertsSkipped++;
          continue;
        }

        try {
          // Get latest prices for this shoe
          const { data: latestPrices, error: priceError } = await supabase
            .from('prices')
            .select('*')
            .eq('shoe_id', watchlist.shoe_id)
            .order('date', { ascending: false })
            .limit(1);

          if (priceError) {
            console.error(`Error fetching prices for shoe ${watchlist.shoe_id}:`, priceError);
            continue;
          }

          if (latestPrices && latestPrices.length >= 1) {
            const currentPrice = latestPrices[0].price;
            const discountPercentage = latestPrices[0].discount_percentage;
            const userDiscountThreshold = watchlist.discount || 10;
            
            // Skip if current price is null
            if (currentPrice === null) {
              continue;
            }
            
            // Skip if no discount percentage stored
            if (discountPercentage === null) {
              continue;
            }

            if (discountPercentage >= userDiscountThreshold) {
              await this.sendPriceAlert(watchlist.users, watchlist.shoes, currentPrice, discountPercentage);
              alertsSent++;
            }
          }
        } catch (error) {
          console.error(`Error processing watchlist ${watchlist.id}:`, error);
        }
      }

      console.log(`Sent ${alertsSent} price alerts, skipped ${alertsSkipped} (emails disabled)`);
      
    } catch (error) {
      console.error('Error in price analysis:', error);
    }
  }

  private async sendPriceAlert(user: any, shoe: any, currentPrice: number, discountPercentage: number): Promise<void> {
    try {
      // Get the original price and product URL from the previous price record
      const { data: previousPrice } = await supabase
        .from('prices')
        .select('price, product_url')
        .eq('shoe_id', shoe.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const originalPrice = previousPrice?.price || currentPrice / (1 - discountPercentage / 100);
      const productUrl = previousPrice?.product_url || `https://speedsale.vercel.app/shoes/${shoe.slug}`;

      // Get user's discount threshold from watchlist
      const { data: watchlist } = await supabase
        .from('watchlists')
        .select('discount')
        .eq('user_id', user.id)
        .eq('shoe_id', shoe.id)
        .single();

      const userDiscountThreshold = watchlist?.discount || 10;

      // Prepare email data
      const emailData = {
        user: {
          id: user.id,
          email: user.email,
          fname: user.fname,
          sname: user.sname
        },
        shoe: {
          id: shoe.id,
          brand: shoe.brand,
          model: shoe.model,
          image_url: shoe.image_url,
          category: shoe.category,
          gender: shoe.gender
        },
        current_price: currentPrice,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        user_discount_threshold: userDiscountThreshold,
        product_url: productUrl,
        size: 'Various', // Could be enhanced to get actual size from price data
        color: 'Various' // Could be enhanced to get actual colour from price data
      };

      const success = await this.emailService.sendPriceAlert(emailData);
      
      if (success) {
        console.log(`Price alert sent to ${user.email} for ${shoe.brand} ${shoe.model}`);
      } else {
        console.log(`Failed to send price alert to ${user.email}`);
      }
    } catch (error) {
      console.error(`Error sending price alert to ${user.email}:`, error);
    }
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
        console.error('Database health check failed:', error);
        return;
      }

      // Check if any retailers are enabled
      const enabledRetailers = data?.filter(r => r.enabled).length || 0;
      console.log(`Health check passed - ${enabledRetailers} retailers enabled`);

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  // Public methods for one-time execution
  async runHealthCheck(): Promise<void> {
    await this.healthCheck();
  }

  async runPriceAnalysis(): Promise<void> {
    await this.analysePricesAndSendAlerts();
  }

  async runScrapingJob(retailer: string, category: string): Promise<void> {
    try {
      const result = await this.scraperManager.scrapeRetailer(retailer, category);
      console.log(`Scraping completed: ${result.productsFound} found, ${result.productsSaved} saved`);
    } catch (error) {
      console.error('Scraping failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const scheduler = new ScrapingScheduler();
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  // Handle command-line arguments
  if (command === 'health') {
    console.log('Running health check...');
    await scheduler.runHealthCheck();
    process.exit(0);
  } else if (command === 'analyse' || command === 'analyze') {
    console.log('Running price analysis...');
    await scheduler.runPriceAnalysis();
    process.exit(0);
  } else if (command === 'scrape') {
    const retailer = args[1] || 'sportsshoes';
    const category = args[2] || 'running';
    console.log(`Running scraping for ${retailer} (${category})...`);
    await scheduler.runScrapingJob(retailer, category);
    process.exit(0);
  } else {
    // Default: start the continuous scheduler
    scheduler.start();

    // Keep the process alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch(console.error);
