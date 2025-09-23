import { ScrapedShoe, RetailerConfig } from './types';

export abstract class BaseScraper {
  protected config: RetailerConfig;
  protected userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  constructor(config: RetailerConfig) {
    this.config = config;
  }

  abstract scrapeProducts(category?: string): Promise<ScrapedShoe[]>;
  
  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  protected normalizePrice(priceText: string): number {
    // Remove currency symbols and non-numeric characters except decimal points
    const cleaned = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  protected extractBrandFromName(name: string): string {
    const brands = [
      'Nike', 'Adidas', 'Asics', 'New Balance', 'Puma', 'Reebok', 
      'Saucony', 'Brooks', 'Hoka', 'On', 'Under Armour', 'Mizuno',
      'Salomon', 'Altra', 'Topo Athletic', 'Newton', 'Skechers', 'Inov8', 'Scarpa',
    ];
    
    const foundBrand = brands.find(brand => 
      name.toLowerCase().includes(brand.toLowerCase())
    );
    return foundBrand || 'Unknown';
  }

  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  protected buildCategoryUrl(category?: string): string {
    if (!category || !this.config.categories) {
      return this.config.baseUrl;
    }
    
    const categoryPath = this.config.categories[category];
    if (categoryPath) {
      return `${this.config.baseUrl}${categoryPath}`;
    }
    
    return this.config.baseUrl;
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateProduct(product: Partial<ScrapedShoe>): product is ScrapedShoe {
    return !!(
      product.name &&
      product.brand &&
      product.price &&
      product.price > 0 &&
      product.productUrl
    );
  }
}
