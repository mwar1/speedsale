import * as cheerio from 'cheerio';
import axios from 'axios';
import { BaseScraper } from './base-scraper';
import { ScrapedShoe } from './types';

export class CheerioScraper extends BaseScraper {
  private axiosInstance = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });

  async scrapeProducts(category?: string): Promise<ScrapedShoe[]> {
    const products: ScrapedShoe[] = [];
    
    try {
      console.log(`Starting Cheerio scraping for ${this.config.name}${category ? ` (${category})` : ''}`);
      
      const url = this.buildCategoryUrl(category);
      console.log(`Fetching: ${url}`);
      
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);
      
      // Check if products exist
      const productElements = $(this.config.selectors.productContainer);
      if (productElements.length === 0) {
        console.warn(`No products found with selector: ${this.config.selectors.productContainer}`);
        return products;
      }
      
      console.log(`Found ${productElements.length} product elements`);
      
      // Handle pagination
      if (this.config.pagination.type === 'numbered') {
        await this.handleNumberedPagination($, products);
      } else {
        // Single page scraping
        this.extractProductsFromPage($, products);
      }
      
      console.log(`Successfully scraped ${products.length} products from ${this.config.name}`);
      
    } catch (error) {
      console.error(`Cheerio scraping error for ${this.config.name}:`, error);
    }

    return products;
  }

  private async handleNumberedPagination($: cheerio.CheerioAPI, products: ScrapedShoe[]): Promise<void> {
    console.log('Handling numbered pagination');
    const maxPages = this.config.pagination.maxPages || 5;
    
    // Extract products from first page
    this.extractProductsFromPage($, products);
    
    // Find pagination links
    const paginationLinks = $(this.config.selectors.nextPageButton || '.pagination a, .pager a');
    
    for (let i = 1; i < maxPages && i < paginationLinks.length; i++) {
      try {
        const nextPageUrl = paginationLinks.eq(i).attr('href');
        if (!nextPageUrl) break;
        
        const fullUrl = nextPageUrl.startsWith('http') 
          ? nextPageUrl 
          : `${this.config.baseUrl}${nextPageUrl}`;
        
        console.log(`Fetching page ${i + 1}: ${fullUrl}`);
        
        await this.delay(this.config.rateLimit.delayMs);
        
        const response = await this.axiosInstance.get(fullUrl);
        const page$ = cheerio.load(response.data);
        
        this.extractProductsFromPage(page$, products);
        
      } catch (error) {
        console.error(`Error fetching page ${i + 1}:`, error);
        break;
      }
    }
  }

  private extractProductsFromPage($: cheerio.CheerioAPI, products: ScrapedShoe[]): void {
    const productElements = $(this.config.selectors.productContainer);
    
    productElements.each((index, element) => {
      try {
        const product = this.extractProductData($, element);
        if (product && this.validateProduct(product)) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error extracting product ${index}:`, error);
      }
    });
  }

  private extractProductData($: cheerio.CheerioAPI, element: unknown): ScrapedShoe | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $element = $(element as any);
      
      const name = $element.find(this.config.selectors.productName).text().trim();
      const priceText = $element.find(this.config.selectors.productPrice).text().trim();
      const imageUrl = $element.find(this.config.selectors.productImage).attr('src') || 
                      $element.find(this.config.selectors.productImage).attr('data-src') || '';
      const productUrl = $element.find(this.config.selectors.productLink).attr('href') || '';
      
      if (!name || !priceText || !productUrl) {
        return null;
      }

      const price = this.normalizePrice(priceText);
      if (price === 0) {
        return null;
      }

      const brand = this.extractBrandFromName(name);
      const slug = this.generateSlug(name);
      
      let originalPrice: number | undefined;
      let discountPercentage: number | undefined;
      
      if (this.config.selectors.productOriginalPrice) {
        const originalPriceText = $element.find(this.config.selectors.productOriginalPrice).text().trim();
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

      // Build full image URL
      const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : imageUrl.startsWith('/')
        ? `${this.config.baseUrl}${imageUrl}`
        : `${this.config.baseUrl}/${imageUrl}`;

      return {
        name: name.trim(),
        brand,
        model: name.replace(brand, '').trim(),
        price,
        originalPrice,
        discountPercentage,
        imageUrl: fullImageUrl,
        productUrl: fullProductUrl,
        inStock: true, // Assume in stock unless proven otherwise
        slug
      };
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }
}
