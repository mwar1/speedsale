import { createStandaloneClient } from '@/utils/supabase/standalone';
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
      const supabase = createStandaloneClient();
      
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
    const supabase = createStandaloneClient();
    let savedCount = 0;

    // Create progress bar for database saving
    const saveBar = new cliProgress.SingleBar({
      format: 'Saving    |{bar}| {percentage}% | {value}/{total} products | Saved: {saved}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });
    
    saveBar.start(products.length, 0, { saved: 0 });

    // Batch 1: Get all existing shoes in one query
    const productSlugs = products.map(p => p.slug);
    const { data: existingShoes } = await supabase
      .from('shoes')
      .select('id, slug')
      .in('slug', productSlugs);

    const existingShoesMap = new Map(
      existingShoes?.map(shoe => [shoe.slug, shoe.id]) || []
    );

    // Batch 2: Get today's cheapest prices for all shoes in one query
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPrices } = await supabase
      .from('prices')
      .select('shoe_id, price, id')
      .eq('retailer_id', retailerId)
      .gte('date', `${today}T00:00:00.000Z`)
      .lt('date', `${today}T23:59:59.999Z`)
      .order('shoe_id, price', { ascending: true }); // Order by shoe_id first, then price

    // Create a map with only the cheapest price per shoe
    const todayPricesMap = new Map<string, { price: number; id: string }>();
    if (todayPrices) {
      for (const price of todayPrices) {
        if (price.shoe_id && price.price !== null && !todayPricesMap.has(price.shoe_id)) {
          // Only add the first (cheapest) price for each shoe
          todayPricesMap.set(price.shoe_id, { price: price.price, id: price.id });
        }
      }
    }

    // Process each product individually to ensure proper price handling
    const processedSlugs = new Set<string>(); // Track processed shoes in this session

    for (const product of products) {
      try {
        // Skip if we've already processed this shoe in this session
        if (processedSlugs.has(product.slug)) {
          continue;
        }
        processedSlugs.add(product.slug);

        let shoeId: string;
        
        if (existingShoesMap.has(product.slug)) {
          // Shoe exists, update it
          shoeId = existingShoesMap.get(product.slug)!;
          
          await supabase
            .from('shoes')
            .update({
              price: product.originalPrice || product.price, // Use RRP if available, fallback to current price
              last_scraped: new Date().toISOString()
            })
            .eq('id', shoeId);

          // Handle price with proper duplicate prevention and cheapest price logic
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Get existing prices for this shoe/retailer - use simpler date filtering
          const { data: existingPrices } = await supabase
            .from('prices')
            .select('id, price, date')
            .eq('shoe_id', shoeId)
            .eq('retailer_id', retailerId)
            .order('price', { ascending: true })
            .limit(10); // Get multiple to filter by date in code

          // Filter to only today's prices
          const todayPrices = existingPrices?.filter(price => 
            price.date && price.date.startsWith(today)
          ) || [];

          const existingPrice = todayPrices.length > 0 ? todayPrices[0] : null;

          if (!existingPrice) {
            // No price for today, insert new one
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
          } else if (existingPrice.price && product.price < existingPrice.price) {
            // Found a lower price, update the existing entry
            await supabase
              .from('prices')
              .update({
                price: product.price,
                original_price: product.originalPrice,
                discount_percentage: product.discountPercentage,
                in_stock: product.inStock,
                product_url: product.productUrl,
                date: new Date().toISOString()
              })
              .eq('id', existingPrice.id);
          }
          // If current price is higher, do nothing (keep cheaper price)
        } else {
          // Shoe doesn't exist, create it
          const { data: newShoe, error: shoeError } = await supabase
            .from('shoes')
            .insert({
              brand: product.brand,
              model: product.model,
              slug: product.slug,
              price: product.originalPrice || product.price, // Use RRP if available, fallback to current price
              description: product.description,
              image_url: product.imageUrl,
              category: product.category,
              gender: product.gender,
              last_scraped: new Date().toISOString()
            })
            .select('id')
            .single();

          if (shoeError) {
            console.error('Error creating shoe:', shoeError);
            continue;
          }
          
          shoeId = newShoe.id;
          
          // Create price entry for new shoe
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
        console.error('Error processing product:', error);
      }
      
      // Update progress bar
      saveBar.increment(1, { saved: savedCount });
    }


    saveBar.stop();    
    return savedCount;
  }

  async scheduleScrapingJobs(): Promise<ScrapingResult[]> {
    const supabase = createStandaloneClient();
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
