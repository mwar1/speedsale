#!/usr/bin/env tsx

import 'dotenv-flow/config';
import { EmailService } from '../lib/email-service';

async function testEmailAlerts() {
  console.log('🧪 Testing SpeedSale Email Alert System...\n');

  try {
    const emailService = new EmailService();
    
    // Test 1: Send a test price alert
    console.log('📧 Test 1: Sending test price alert...');
    const testEmail = process.env.TEST_EMAIL || 'mooms890@gmail.com';
    
    const success = await emailService.sendTestEmail(testEmail);
    
    if (success) {
      console.log('✅ Test price alert sent successfully!');
    } else {
      console.log('❌ Test price alert failed!');
    }

    console.log('\n📧 Test 2: Sending welcome email...');
    
    // Test 2: Send a welcome email
    const welcomeData = {
      user: {
        id: 'test-user-123',
        email: testEmail,
        fname: 'Test',
        sname: 'User'
      },
      dashboard_url: 'https://speedsale.vercel.app/dashboard',
      profile_url: 'https://speedsale.vercel.app/profile'
    };

    const welcomeSuccess = await emailService.sendWelcomeEmail(welcomeData);
    
    if (welcomeSuccess) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('❌ Welcome email failed!');
    }

    console.log('\n🎉 Email system test completed!');
    console.log('Check your email inbox for the test messages.');
    
  } catch (error) {
    console.error('💥 Email system test failed:', error);
  }
}

// Run the test
testEmailAlerts().catch(console.error);
