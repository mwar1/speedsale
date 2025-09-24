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
      
      // Extract brand from cleaned name and create model without brand
      const brand = product.brand || '';
      let model = product.name;
      
      // Remove brand from the beginning of the model if it's there
      if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) {
        model = model.substring(brand.length).trim();
      }
      
      // Handle special cases for "On" brand
      if (brand === 'On') {
        // Remove "Running On" prefix and just keep the model name
        model = model.replace(/^Running\s+On\s+/i, '').trim();
        // Remove "On" from the beginning if it's still there
        if (model.toLowerCase().startsWith('on ')) {
          model = model.substring(3).trim();
        }
      }
      
      return {
        ...product,
        model: model,
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