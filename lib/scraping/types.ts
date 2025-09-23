export interface ScrapedShoe {
  name: string;
  brand: string;
  model: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
  description?: string;
  category?: string;
  gender?: string;
  slug: string;
}

export interface RetailerConfig {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  scrapingMethod: 'playwright' | 'cheerio';
  selectors: {
    productContainer: string;
    productName: string;
    productPrice: string;
    productOriginalPrice?: string;
    productImage: string;
    productLink: string;
    nextPageButton?: string;
    loadMoreButton?: string;
  };
  pagination: {
    type: 'infinite' | 'numbered' | 'load-more';
    maxPages?: number;
  };
  rateLimit: {
    delayMs: number;
    maxConcurrent: number;
  };
  categories?: {
    running: string;
    [key: string]: string;
  };
  processProductData?: (product: ScrapedShoe, url: string) => ScrapedShoe;
}

export interface ScrapingJob {
  retailerId: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
  scheduledAt?: Date;
}

export interface ScrapingResult {
  retailerId: string;
  success: boolean;
  productsFound: number;
  productsSaved: number;
  errors: string[];
  duration: number;
}
