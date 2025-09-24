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
    // Sort brands by length (longest first) to avoid substring conflicts
    const brands = [
      'Under Armour', 'Topo Athletic', 'New Balance', 'Salomon', 'Skechers',
      'Nike', 'Adidas', 'Asics', 'Puma', 'Reebok', 'Saucony', 'Brooks', 
      'Hoka', 'On', 'Mizuno', 'Altra', 'Newton', 'Inov8', 'Scarpa', 'True Motion',
      'Merrell', 'Scott', 'NNormal', 'La Sportiva', 'VJ Sport', 'Norda', 'The North Face',
      'Veja', 'Vibram', 'RonHill', 'OOFOS'
    ];
    
    // Find the longest matching brand
    let foundBrand = '';
    let maxLength = 0;
    
    for (const brand of brands) {
      const brandLower = brand.toLowerCase();
      const nameLower = name.toLowerCase();
      
      // Check if brand appears at the start of the name (most common case)
      if (nameLower.startsWith(brandLower + ' ') && brand.length > maxLength) {
        foundBrand = brand;
        maxLength = brand.length;
      }
      // Check if brand appears anywhere in the name (fallback)
      else if (nameLower.includes(brandLower) && brand.length > maxLength) {
        foundBrand = brand;
        maxLength = brand.length;
      }
    }
    
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

  protected cleanProductName(name: string): string {
    let cleanName = name || '';
    
    // Remove delivery prefixes
    cleanName = cleanName
      .replace(/^Free Premium Delivery\s+/i, '')
      .replace(/^Free Express Delivery\s+/i, '')
      .replace(/^Free Delivery\s+/i, '');
    
    // Remove everything from the first £ onwards (prices, RRP, colours, etc.)
    cleanName = cleanName.replace(/\s+£.*$/, '');
    
    // Remove unwanted patterns and everything after them
    const unwantedPatterns = [
      // Unwanted shoe types
      'Walking Boots', 'Walking Boot',
      'Running Spikes', 'Throwing Shoes', 
      'Cross Country Spikes', 'Distance Spikes', 'Multi-Event Spikes',
      // Shoe type suffixes
      'Men\'s Trail Running Shoes', 'Men\'s Running Shoes',
      'Women\'s Trail Running Shoes', 'Women\'s Running Shoes',
      'Trail Running Shoes', 'Running Shoes', 'Sprint Spikes',
      'Men\'s Training Shoes', 'Women\'s Training Shoes', 'Training Shoes'
    ];
    
    for (const pattern of unwantedPatterns) {
      const regex = new RegExp(`\\s+${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i');
      cleanName = cleanName.replace(regex, '');
    }
    
    // Remove season codes
    cleanName = cleanName.replace(/\s+-\s*(AW|FA|SS)\d{2}\s*$/i, '');
    
    return cleanName.trim();
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
