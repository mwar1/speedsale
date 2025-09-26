import { EmailService } from './email-service';
import { supabase } from '@/lib/db';

interface User {
  id: string;
  email: string;
  fname: string | null;
  sname: string | null;
}

interface Shoe {
  id: string;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  category: string | null;
  gender: string | null;
  slug: string | null;
}

class PriceAnalyser {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async analysePricesAndSendAlerts(): Promise<void> {
    try {
      // Get users with watchlists
      const { data: watchlists, error } = await supabase
        .from('watchlists')
        .select(`
          *,
          shoes(*),
          users(*)
        `);

      if (error) {
        console.error('Error fetching watchlists:', error);
        return;
      }

      if (!watchlists || watchlists.length === 0) {
        console.log('No watchlists found');
        return;
      }

      console.log(`Analysing ${watchlists.length} watchlists...`);

      let alertsSent = 0;
      let alertsSkipped = 0;

      for (const watchlist of watchlists) {
        if (!watchlist.shoes || !watchlist.users || !watchlist.shoe_id) continue;

        // Check if user has email notifications enabled
        const { data: userPreferences } = await supabase
          .from('user_preferences')
          .select('email_enabled')
          .eq('user_id', watchlist.users.id)
          .single();

        if (userPreferences?.email_enabled === false) {
          alertsSkipped++;
          continue;
        }

        try {
          // Get latest prices for this shoe
          const { data: latestPrices, error: priceError } = await supabase
            .from('prices')
            .select('*')
            .eq('shoe_id', watchlist.shoe_id)
            .order('date', { ascending: false })
            .limit(1);

          if (priceError) {
            console.error(`Error fetching prices for shoe ${watchlist.shoe_id}:`, priceError);
            continue;
          }

          if (latestPrices && latestPrices.length >= 1) {
            const currentPrice = latestPrices[0].price;
            const discountPercentage = latestPrices[0].discount_percentage;
            const userDiscountThreshold = watchlist.discount || 10;
            
            // Skip if current price is null
            if (currentPrice === null) {
              continue;
            }
            
            // Skip if no discount percentage stored
            if (discountPercentage === null) {
              continue;
            }

            if (discountPercentage >= userDiscountThreshold) {
              await this.sendPriceAlert(watchlist.users, watchlist.shoes, currentPrice, discountPercentage);
              alertsSent++;
            }
          }
        } catch (error) {
          console.error(`Error processing watchlist ${watchlist.id}:`, error);
        }
      }

      console.log(`Sent ${alertsSent} price alerts, skipped ${alertsSkipped} (emails disabled)`);
      
    } catch (error) {
      console.error('Error in price analysis:', error);
    }
  }

  private async sendPriceAlert(user: User, shoe: Shoe, currentPrice: number, discountPercentage: number): Promise<void> {
    try {
      // Get the original price and product URL from the previous price record
      const { data: previousPrice } = await supabase
        .from('prices')
        .select('price, product_url')
        .eq('shoe_id', shoe.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const originalPrice = previousPrice?.price || currentPrice / (1 - discountPercentage / 100);
      const productUrl = previousPrice?.product_url || `https://speedsale.vercel.app/shoes/${shoe.slug}`;

      // Get user's discount threshold from watchlist
      const { data: watchlist } = await supabase
        .from('watchlists')
        .select('discount')
        .eq('user_id', user.id)
        .eq('shoe_id', shoe.id)
        .single();

      const userDiscountThreshold = watchlist?.discount || 10;

      // Prepare email data
      const emailData = {
        user: {
          id: user.id,
          email: user.email,
          fname: user.fname,
          sname: user.sname
        },
        shoe: {
          id: shoe.id,
          brand: shoe.brand,
          model: shoe.model,
          image_url: shoe.image_url,
          category: shoe.category,
          gender: shoe.gender
        },
        current_price: currentPrice,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        user_discount_threshold: userDiscountThreshold,
        product_url: productUrl,
        size: 'Various', // Could be enhanced to get actual size from price data
        color: 'Various' // Could be enhanced to get actual colour from price data
      };

      const success = await this.emailService.sendPriceAlert(emailData);
      
      if (success) {
        console.log(`Price alert sent to ${user.email} for ${shoe.brand} ${shoe.model}`);
      } else {
        console.log(`Failed to send price alert to ${user.email}`);
      }
    } catch (error) {
      console.error(`Error sending price alert to ${user.email}:`, error);
    }
  }

  async runHealthCheck(): Promise<void> {
    try {
      // Check database connection
      const { data, error } = await supabase
        .from('retailers')
        .select('id, enabled, last_scraped')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error);
        return;
      }

      // Check if any retailers are enabled
      const enabledRetailers = data?.filter(r => r.enabled).length || 0;
      console.log(`Health check passed - ${enabledRetailers} retailers enabled`);

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
}

export { PriceAnalyser };
