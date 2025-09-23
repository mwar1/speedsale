import { supabase } from '@/lib/db';
import { ScrapedShoe, ScrapingJob, ScrapingResult } from './types';
import { PlaywrightScraper } from './playwright-scraper';
import { CheerioScraper } from './cheerio-scraper';
import { retailerConfigs, getRetailerById } from './retailer-configs';
import * as cliProgress from 'cli-progress';

export class ScraperManager {
  async processScrapingJob(job: ScrapingJob): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      retailerId: job.retailerId,
      success: false,
      productsFound: 0,
      productsSaved: 0,
      errors: [],
      duration: 0
    };

    try {
      // Check if retailer is enabled in database
      const { data: dbRetailer, error: dbError } = await supabase
        .from('retailers')
        .select('enabled, last_scraped, scraping_interval_hours')
        .eq('id', job.retailerId)
        .maybeSingle();

      if (dbError) {
        result.errors.push(`Database error: ${dbError.message}`);
        return result;
      }

      if (!dbRetailer?.enabled) {
        result.errors.push(`Retailer ${job.retailerId} is disabled in database`);
        return result;
      }

      // Get retailer configuration
      const config = getRetailerById(job.retailerId);
      if (!config) {
        result.errors.push(`Retailer configuration not found for ${job.retailerId}`);
        return result;
      }

      if (!config.enabled) {
        result.errors.push(`Retailer ${job.retailerId} is disabled in configuration`);
        return result;
      }

      console.log(`Processing scraping job for ${config.name} (${job.retailerId})`);

      // Create appropriate scraper
      let scraper;
      if (config.scrapingMethod === 'playwright') {
        scraper = new PlaywrightScraper(config);
      } else if (config.scrapingMethod === 'cheerio') {
        scraper = new CheerioScraper(config);
      } else {
        result.errors.push(`Unknown scraping method: ${config.scrapingMethod}`);
        return result;
      }

      // Scrape products
      const products = await scraper.scrapeProducts(job.category);
      result.productsFound = products.length;

      if (products.length === 0) {
        result.errors.push('No products found during scraping');
        return result;
      }

      // Save products to database
      const savedCount = await this.saveProducts(products, job.retailerId);
      result.productsSaved = savedCount;

      // Update retailer last scraped timestamp
      await supabase
        .from('retailers')
        .update({ 
          last_scraped: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scraping_config: config as any
        })
        .eq('id', job.retailerId);

      result.success = true;
      console.log(`Successfully processed ${result.productsSaved}/${result.productsFound} products for ${config.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Scraping failed: ${errorMessage}`);
      console.error(`Scraping failed for ${job.retailerId}:`, error);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  private async saveProducts(products: ScrapedShoe[], retailerId: string): Promise<number> {
    let savedCount = 0;

    // Create progress bar for database saving
    const saveBar = new cliProgress.SingleBar({
      format: 'Saving    |{bar}| {percentage}% | {value}/{total} products | Saved: {saved}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });
    
    saveBar.start(products.length, 0, { saved: 0 });

    for (const product of products) {
      try {
        // Check if shoe already exists
        const { data: existingShoe } = await supabase
          .from('shoes')
          .select('id')
          .eq('slug', product.slug)
          .maybeSingle();

        let shoeId: string;
        
        if (existingShoe) {
          shoeId = existingShoe.id;
          
          // Update existing shoe with latest info
          await supabase
            .from('shoes')
            .update({
              price: product.price,
              last_scraped: new Date().toISOString()
            })
            .eq('id', shoeId);
        } else {
          // Create new shoe
          const { data: newShoe, error } = await supabase
            .from('shoes')
            .insert({
              brand: product.brand,
              model: product.model,
              slug: product.slug,
              price: product.price,
              description: product.description,
              image_url: product.imageUrl,
              category: product.category,
              gender: product.gender,
              last_scraped: new Date().toISOString()
            })
            .select('id')
            .maybeSingle();

          if (error) {
            console.error('Error creating shoe:', error);
            continue;
          }
          if (!newShoe) {
            console.error('No shoe data returned from insert');
            continue;
          }
          shoeId = newShoe.id;
        }

        // Save price data (only if price changed or it's a new entry)
        const { data: latestPrice } = await supabase
          .from('prices')
          .select('price')
          .eq('shoe_id', shoeId)
          .eq('retailer_id', retailerId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const shouldSavePrice = !latestPrice || latestPrice.price !== product.price;

        if (shouldSavePrice) {
          await supabase
            .from('prices')
            .insert({
              shoe_id: shoeId,
              retailer_id: retailerId,
              price: product.price,
              original_price: product.originalPrice,
              discount_percentage: product.discountPercentage,
              in_stock: product.inStock,
              product_url: product.productUrl,
              date: new Date().toISOString()
            });
        }

        savedCount++;

      } catch (error) {
        console.error('Error saving product:', error);
      }
      
      // Update progress bar
      saveBar.increment(1, { saved: savedCount });
    }

    saveBar.stop();
    return savedCount;
  }

  async scheduleScrapingJobs(): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const enabledRetailers = retailerConfigs.filter(r => r.enabled);
    
    console.log(`Checking ${enabledRetailers.length} enabled retailers for scraping`);

    for (const retailer of enabledRetailers) {
      try {
        // Check if it's time to scrape this retailer
        const { data: retailerData } = await supabase
          .from('retailers')
          .select('enabled, last_scraped, scraping_interval_hours')
          .eq('id', retailer.id)
          .maybeSingle();

        // Skip if disabled in database
        if (!retailerData?.enabled) {
          console.log(`Skipping ${retailer.name} - disabled in database`);
          continue;
        }

        const lastScraped = retailerData?.last_scraped 
          ? new Date(retailerData.last_scraped)
          : new Date(0);
        
        const intervalHours = retailerData?.scraping_interval_hours || 24;
        const nextScrapeTime = new Date(lastScraped.getTime() + intervalHours * 60 * 60 * 1000);
        
        if (new Date() >= nextScrapeTime) {
          console.log(`Scheduling scraping for ${retailer.name}`);
          
          const job: ScrapingJob = {
            retailerId: retailer.id,
            priority: 'medium'
          };
          
          const result = await this.processScrapingJob(job);
          results.push(result);
        } else {
          console.log(`Skipping ${retailer.name} - next scrape at ${nextScrapeTime.toISOString()}`);
        }
      } catch (error) {
        console.error(`Error checking retailer ${retailer.id}:`, error);
        results.push({
          retailerId: retailer.id,
          success: false,
          productsFound: 0,
          productsSaved: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: 0
        });
      }
    }

    return results;
  }

  async scrapeAllRetailers(): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const enabledRetailers = retailerConfigs.filter(r => r.enabled);
    
    console.log(`Starting scraping for all ${enabledRetailers.length} enabled retailers`);

    for (const retailer of enabledRetailers) {
      try {
        const job: ScrapingJob = {
          retailerId: retailer.id,
          priority: 'high'
        };
        
        const result = await this.processScrapingJob(job);
        results.push(result);
        
        // Add delay between retailers to be respectful
        if (retailer.rateLimit.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, retailer.rateLimit.delayMs));
        }
      } catch (error) {
        console.error(`Error scraping retailer ${retailer.id}:`, error);
        results.push({
          retailerId: retailer.id,
          success: false,
          productsFound: 0,
          productsSaved: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: 0
        });
      }
    }

    return results;
  }

  async scrapeRetailer(retailerId: string, category?: string): Promise<ScrapingResult> {
    const job: ScrapingJob = {
      retailerId,
      category,
      priority: 'high'
    };
    
    return await this.processScrapingJob(job);
  }
}
