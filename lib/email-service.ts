import FormData from "form-data";
import Mailgun from "mailgun.js";
import { readFileSync } from "fs";
import { join } from "path";


interface PriceAlertData {
  user: {
    id: string;
    email: string;
    fname: string | null;
    sname: string | null;
  };
  shoe: {
    id: string;
    brand: string | null;
    model: string | null;
    image_url: string | null;
    category: string | null;
    gender: string | null;
  };
  current_price: number;
  original_price: number;
  discount_percentage: number;
  size?: string;
  color?: string;
  product_url?: string;
  user_discount_threshold: number;
}

interface WelcomeEmailData {
  user: {
    id: string;
    email: string;
    fname: string | null;
    sname: string | null;
  };
  dashboard_url: string;
  profile_url: string;
}

class EmailService {
  private mailgun: {
    messages: {
      create: (domain: string, data: {
        from: string;
        to: string[];
        subject: string;
        text: string;
        html: string;
      }) => Promise<unknown>;
    };
  };
  private domain: string;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY;
    this.domain = process.env.MAILGUN_DOMAIN!;
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL!;

    if (!apiKey || !this.domain || !this.fromEmail) {
      throw new Error('Missing required Mailgun environment variables');
    }

    const mailgun = new Mailgun(FormData);
    this.mailgun = mailgun.client({
      username: "api",
      key: apiKey,
    });
  }

  private loadTemplate(templateName: string): string {
    try {
      const templatePath = join(process.cwd(), 'templates', `${templateName}.html`);
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;
    
    // Replace all {{variable}} patterns, including nested object properties
    const replaceNested = (obj: Record<string, unknown>, prefix: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively handle nested objects
          replaceNested(value as Record<string, unknown>, fullKey);
        } else {
          // Replace the variable in the template
          const regex = new RegExp(`{{${fullKey}}}`, 'g');
          result = result.replace(regex, String(value || ''));
        }
      }
    };
    
    replaceNested(variables);
    
    return result;
  }

  private generateTextVersion(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async sendPriceAlert(data: PriceAlertData): Promise<boolean> {
    try {
      const template = this.loadTemplate('price-alert');
      
      // Prepare template variables
      const variables = {
        ...data,
        shoe: data.shoe,
        user: data.user,
        current_price: data.current_price.toFixed(2),
        original_price: data.original_price.toFixed(2),
        discount_percentage: data.discount_percentage.toFixed(1),
        size: data.size || 'Various',
        color: data.color || 'Various',
        product_url: data.product_url || '#',
        user_discount_threshold: data.user_discount_threshold,
        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://speedsale.vercel.app'}/profile`
      };

      const html = this.replaceTemplateVariables(template, variables);
      const text = this.generateTextVersion(html);
      
      const subject = `🚨 Price Alert: ${data.shoe.brand} ${data.shoe.model} - ${data.discount_percentage.toFixed(1)}% off!`;

      const emailData = {
        from: this.fromEmail,
        to: [data.user.email],
        subject,
        text,
        html,
      };

      console.log(`📧 Sending price alert to ${data.user.email} for ${data.shoe.brand} ${data.shoe.model}`);
      
      await this.mailgun.messages.create(this.domain, emailData);
      
      console.log(`✅ Price alert sent successfully to ${data.user.email}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send price alert to ${data.user.email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const template = this.loadTemplate('welcome');
      
      // Prepare template variables
      const variables = {
        ...data,
        user: data.user,
        dashboard_url: data.dashboard_url,
        profile_url: data.profile_url
      };

      const html = this.replaceTemplateVariables(template, variables);
      const text = this.generateTextVersion(html);
      
      const subject = `Welcome to SpeedSale, ${data.user.fname || 'there'}! 🏃‍♂️`;

      const emailData = {
        from: this.fromEmail,
        to: [data.user.email],
        subject,
        text,
        html,
      };

      console.log(`📧 Sending welcome email to ${data.user.email}`);
      
      await this.mailgun.messages.create(this.domain, emailData);
      
      console.log(`✅ Welcome email sent successfully to ${data.user.email}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${data.user.email}:`, error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    try {
      // Use sample data for testing
      const sampleData: PriceAlertData = {
        user: {
          id: 'test-user',
          email: to,
          fname: 'Test',
          sname: 'User'
        },
        shoe: {
          id: 'test-shoe',
          brand: 'Nike',
          model: 'Air Zoom Pegasus 40',
          image_url: 'https://via.placeholder.com/120x120?text=Test+Shoe',
          category: 'Running',
          gender: 'Unisex'
        },
        current_price: 89.99,
        original_price: 129.99,
        discount_percentage: 30.8,
        size: 'UK 9',
        color: 'Black/White',
        product_url: 'https://www.sportsshoes.com/product/nike/air-zoom-pegasus-40/',
        user_discount_threshold: 20
      };

      return await this.sendPriceAlert(sampleData);
      
    } catch (error) {
      console.error(`❌ Failed to send test email to ${to}:`, error);
      return false;
    }
  }
}

export { EmailService, type PriceAlertData, type WelcomeEmailData };
