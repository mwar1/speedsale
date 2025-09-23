import { RetailerConfig } from './types';

export const retailerConfigs: RetailerConfig[] = [
  {
    id: 'sportsshoes',
    name: 'SportsShoes',
    baseUrl: 'https://www.sportsshoes.com',
    enabled: true,
    scrapingMethod: 'playwright',
    selectors: {
      productContainer: '[class*="css-1n4"]',
      productName: 'p[class*="chakra-text"]',
      productPrice: 'span',
      productOriginalPrice: '.was-price, .original-price, .rrp',
      productImage: 'img',
      productLink: 'a',
      nextPageButton: 'button:has-text("2"), button:has-text("3"), button:has-text("4"), button:has-text("5")'
    },
    pagination: {
      type: 'numbered',
      maxPages: 10
    },
    rateLimit: {
      delayMs: 200,
      maxConcurrent: 3
    },
    categories: {
      running: '/products/mens/running/shoes',
      women: '/products/womens/running/shoes'
    },
    // Custom processing for SportsShoes
    processProductData: (product, url) => {
      // Extract gender from URL
      let gender = 'unisex';
      if (url.includes('/mens/')) gender = 'male';
      else if (url.includes('/womens/')) gender = 'female';
      
      // Clean model name - remove delivery and promotional text
      let cleanName = product.name || '';
      
      // Remove delivery prefixes
      cleanName = cleanName
        .replace(/^Free Premium Delivery\s+/i, '')
        .replace(/^Free Express Delivery\s+/i, '')
        .replace(/^Free Delivery\s+/i, '');
      
      // Remove everything from the first £ onwards (prices, RRP, colours, etc.)
      cleanName = cleanName.replace(/\s+£.*$/, '');
      
      // Remove season codes
      cleanName = cleanName.replace(/\s+-\s*(AW|FA|SS)\d{2}\s*$/i, '');
      
      // Remove shoe type suffixes (including text after them)
      cleanName = cleanName
        .replace(/\s+Men's\s+Trail\s+Running\s+Shoes.*$/i, '')
        .replace(/\s+Men's\s+Running\s+Shoes.*$/i, '')
        .replace(/\s+Women's\s+Trail\s+Running\s+Shoes.*$/i, '')
        .replace(/\s+Women's\s+Running\s+Shoes.*$/i, '')
        .replace(/\s+Trail\s+Running\s+Shoes.*$/i, '')
        .replace(/\s+Running\s+Shoes.*$/i, '');
      
      cleanName = cleanName.trim();
      
      // Extract brand from cleaned name and create model without brand
      const brand = product.brand || '';
      let model = cleanName;
      
      // Remove brand from the beginning of the model if it's there
      if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) {
        model = model.substring(brand.length).trim();
      }
      
      // Create slug from brand + model
      const slugParts = [brand, model].filter(part => part && part.trim());
      const slug = slugParts.join(' ').toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      return {
        ...product,
        name: cleanName,
        model: model,
        slug: slug,
        gender
      };
    }
  }
];

export function getRetailerById(id: string): RetailerConfig | undefined {
  return retailerConfigs.find(config => config.id === id);
}

export function getEnabledRetailers(): RetailerConfig[] {
  return retailerConfigs.filter(config => config.enabled);
}