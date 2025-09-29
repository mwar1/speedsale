#!/usr/bin/env tsx

import 'dotenv-flow/config';
import { ScraperManager } from '../lib/scraping/scraper-manager';

async function main() {
  if (!process.argv[2]) {
    console.error('Retailer is required');
    process.exit(1);
  }
  if (!process.argv[3]) {
    console.error('Category is required');
    process.exit(1);
  }

  const retailer = process.argv[2];
  const category = process.argv[3];
  
  const scraperManager = new ScraperManager();
  const result = await scraperManager.scrapeRetailer(retailer, category);
  console.log(`Scraping completed: ${result.productsFound} found, ${result.productsSaved} saved`);
  
  // Explicitly exit to ensure clean termination
  process.exit(0);
}

main().catch(console.error);
