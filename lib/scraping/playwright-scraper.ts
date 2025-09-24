import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScrapedShoe } from './types';
import * as cliProgress from 'cli-progress';

export class PlaywrightScraper extends BaseScraper {
  private browser: Browser | null = null;

  async scrapeProducts(category?: string): Promise<ScrapedShoe[]> {
    const products: ScrapedShoe[] = [];
    
    try {
      console.log(`Starting Playwright scraping for ${this.config.name}${category ? ` (${category})` : ''}`);
      
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
      });
      
      const page = await context.newPage();
      
      // Block unnecessary resources for faster loading
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      const url = this.buildCategoryUrl(category);
      console.log(`Navigating to: ${url}`);
      
      // Use domcontentloaded for much faster page loading
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });

      // Quick popup handling
      await this.handlePopups(page);

      // Handle different pagination types with optimized approach
      if (this.config.pagination.type === 'infinite') {
        await this.handleInfiniteScroll(page);
        await this.extractProductsFromPage(page, products);
      } else if (this.config.pagination.type === 'numbered') {
        await this.handleNumberedPaginationOptimized(page, products);
      } else if (this.config.pagination.type === 'load-more') {
        await this.handleLoadMorePagination(page);
        await this.extractProductsFromPage(page, products);
      } else {
        await this.extractProductsFromPage(page, products);
      }

      await context.close();
      console.log(`Successfully scraped ${products.length} products from ${this.config.name}`);
      
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
    
    return products;
  }

  private async handlePopups(page: Page): Promise<void> {
    const popupSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Close")',
      'button:has-text("No Thanks")',
      'button[class*="accept"]',
      'button[class*="close"]'
    ];
    
    for (const selector of popupSelectors) {
      try {
        const popupButton = await page.$(selector);
        if (popupButton) {
          await popupButton.click();
          await this.delay(200); // Reduced delay
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
  }

      private async handleNumberedPaginationOptimized(page: Page, products: ScrapedShoe[]): Promise<void> {
    console.log('Handling URL-based pagination for SportsShoes');
    const maxPages = this.config.pagination.maxPages || 10;
    
    // Create progress bar
    const paginationBar = new cliProgress.SingleBar({
      format: 'Pagination |{bar}| {percentage}% | Page {value} | Products: {products}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
    
    paginationBar.start(maxPages, 0, { products: 0 });
    
    let currentPage = 1;
    
    // Extract products from first page
    await this.extractProductsFromPage(page, products);
    paginationBar.update(currentPage, { products: products.length });
    
    // URL-based pagination for SportsShoes
    while (currentPage < maxPages) {
      try {
        currentPage++;
        
        // Construct the URL for the next page (SportsShoes format: shoes?page=2)
        const currentUrl = page.url();
        let nextPageUrl: string;
        
        if (currentUrl.includes('page=')) {
          // Replace existing page parameter
          nextPageUrl = currentUrl.replace(/page=\d+/, `page=${currentPage}`);
        } else {
          // Add page parameter to existing URL
          nextPageUrl = currentUrl + `?page=${currentPage}`;
        }
        
        console.log(`\nNavigating to page ${currentPage}: ${nextPageUrl}`);
        
        // Navigate to the next page
        await page.goto(nextPageUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Handle any popups that might appear
        const popupSelectors = ['button:has-text("Accept")', 'button:has-text("Close")', 'button:has-text("No Thanks")'];
        for (const selector of popupSelectors) {
          try {
            const popupButton = await page.$(selector);
            if (popupButton) {
              await popupButton.click();
              await this.delay(500);
              break;
            }
          } catch {
            // Continue
          }
        }
        
        // Extract products from current page
        await this.extractProductsFromPage(page, products);
        paginationBar.update(currentPage, { products: products.length });
        
      } catch (error) {
        console.error(`\nPagination error at page ${currentPage}:`, error);
        break;
      }
    }
    
    paginationBar.stop();
    console.log(`\n✅ Pagination complete: ${products.length} products found across ${currentPage} pages`);
  }

  private async extractProductsFromPage(page: Page, products: ScrapedShoe[]): Promise<void> {
    const productElements = await page.$$(this.config.selectors.productContainer);
    
    if (productElements.length === 0) return;
    
    // Create progress bar for product extraction
    const extractionBar = new cliProgress.SingleBar({
      format: 'Extracting |{bar}| {percentage}% | {value}/{total} products | Valid: {valid}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });
    
    extractionBar.start(productElements.length, 0, { valid: 0 });
    
    for (let i = 0; i < productElements.length; i++) {
      try {
        const product = await this.extractProductData(productElements[i]);
        if (product && this.validateProduct(product)) {
          products.push(product);
        }
        
        extractionBar.update(i + 1, { valid: products.length });
        
        // Reduced delay - only every 20 products instead of 10
        if (i % 20 === 0 && i > 0) {
          await this.delay(200); // Reduced from 500ms
        }
      } catch (error) {
        console.error(`\nError extracting product ${i}:`, error);
        extractionBar.update(i + 1, { valid: products.length });
      }
    }
    
    extractionBar.stop();
  }

  private async handleInfiniteScroll(page: Page): Promise<void> {
    console.log('Handling infinite scroll pagination');
    const maxScrolls = this.config.pagination.maxPages || 10;
    
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight') as number;
    let scrollAttempts = 0;
    
    while (previousHeight !== currentHeight && scrollAttempts < maxScrolls) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await this.delay(1000);
      currentHeight = await page.evaluate('document.body.scrollHeight') as number;
      scrollAttempts++;
    }
  }

  private async handleLoadMorePagination(page: Page): Promise<void> {
    console.log('Handling load more pagination');
    const maxLoads = this.config.pagination.maxPages || 5;
    
    for (let i = 0; i < maxLoads; i++) {
      const loadMoreButton = await page.$(this.config.selectors.loadMoreButton!);
      if (!loadMoreButton) {
        break;
      }
      
      await loadMoreButton.click();
      await this.delay(1000);
      await page.waitForLoadState('domcontentloaded');
    }
  }

  private async extractProductData(element: ElementHandle): Promise<ScrapedShoe | null> {
    try {
      // Get all name elements and combine them (for SportsShoes where name is split across multiple elements)
      const nameElements = await element.$$(this.config.selectors.productName);
      let name = '';
      if (nameElements.length > 0) {
        const nameTexts = await Promise.all(nameElements.map(el => el.textContent()));
        name = nameTexts.filter(text => text && text.trim()).join(' ').trim();
      }
      
      // Get price text - for SportsShoes, find the span that contains a price
      let priceText = '';
      if (this.config.id === 'sportsshoes') {
        // Find all spans and look for one that contains a price
        const spans = await element.$$(this.config.selectors.productPrice);
        for (const span of spans) {
          const text = await span.textContent();
          if (text && /£[\d,]+\.?\d*/.test(text)) {
            priceText = text;
            break;
          }
        }
      } else {
        const priceElement = await element.$(this.config.selectors.productPrice);
        priceText = priceElement ? await priceElement.textContent() || '' : '';
      }
      const imageUrl = await element.getAttribute(this.config.selectors.productImage);
      
      // Find the product link element and get its href
      const linkElements = await element.$$(this.config.selectors.productLink);
      const productUrl = linkElements.length > 0 ? await linkElements[0].getAttribute('href') : null;
      
      if (!name || !priceText || !productUrl) {
        return null;
      }

      const price = this.normalizePrice(priceText);
      if (price === 0) {
        return null;
      }

      const brand = this.extractBrandFromName(name);
      
      let originalPrice: number | undefined;
      let discountPercentage: number | undefined;
      
      if (this.config.selectors.productOriginalPrice) {
        const originalPriceElement = await element.$(this.config.selectors.productOriginalPrice);
        const originalPriceText = originalPriceElement ? await originalPriceElement.textContent() : null;
        if (originalPriceText) {
          originalPrice = this.normalizePrice(originalPriceText);
          if (originalPrice > price) {
            discountPercentage = ((originalPrice - price) / originalPrice) * 100;
          }
        }
      }

      // Build full product URL
      const fullProductUrl = productUrl.startsWith('http') 
        ? productUrl 
        : `${this.config.baseUrl}${productUrl}`;

      const product = {
        name: name.trim(),
        brand,
        model: name.replace(brand, '').trim(),
        price,
        originalPrice,
        discountPercentage,
        imageUrl: imageUrl || '',
        productUrl: fullProductUrl,
        inStock: true, // Assume in stock unless proven otherwise
        slug: '' // Will be set after processing
      };

      // Clean the product name using centralized logic
      const cleanName = this.cleanProductName(product.name);
      product.name = cleanName;
      
      // Apply custom processing if configured
      if (this.config.processProductData) {
        const processedProduct = this.config.processProductData(product, fullProductUrl);
        // Generate slug from the processed name
        processedProduct.slug = this.generateSlug(processedProduct.name);
        return processedProduct;
      }

      // Generate slug from cleaned name if no processing
      product.slug = this.generateSlug(product.name);
      return product;
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
