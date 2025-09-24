#!/usr/bin/env tsx

import 'dotenv-flow/config';
import { ScraperManager } from '../lib/scraping/scraper-manager';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const category = args[1];

  const scraperManager = new ScraperManager();

  console.log('🚀 Speed Sale Scraper\n');

  switch (command) {
    case 'sportsshoes':
      await scrapeSportsShoes(category || 'running');
      break;
    
    default:
      console.log('Usage: npm run scraper <command> [category]');
      console.log('Commands:');
      console.log('  sportsshoes [category]  - Scrape SportsShoes (default category: running)');
      console.log('Examples:');
      console.log('  npm run scraper sportsshoes');
      console.log('  npm run scraper sportsshoes running');
      break;
  }
}

async function scrapeSportsShoes(category: string) {
  console.log(`🧪 Scraping SportsShoes (${category})...\n`);
  
  try {
    const startTime = Date.now();
    const result = await new ScraperManager().scrapeRetailer('sportsshoes', category);
    const duration = Date.now() - startTime;
    
    console.log('\n📊 Scraping Results:');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Products Found: ${result.productsFound}`);
    console.log(`Products Saved: ${result.productsSaved}`);
    console.log(`Duration: ${duration}ms`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (!result.success) {
      console.log('⚠️ Scraping completed with issues.');
      process.exit(1);
    } else {
      console.log('✅ Scraping completed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Fatal error during scraping:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});