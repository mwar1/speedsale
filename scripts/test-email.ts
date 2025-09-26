#!/usr/bin/env tsx

import 'dotenv-flow/config';

import FormData from "form-data";
import Mailgun from "mailgun.js";


async function sendTestEmail() {
  console.log('Starting Mailgun email test...\n');

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;

  if (!apiKey) {
    console.error('❌ MAILGUN_API_KEY not found in environment variables');
    console.log('Please add MAILGUN_API_KEY to your .env.local file');
    return;
  }

  if (!domain) {
    console.error('❌ MAILGUN_DOMAIN not found in environment variables');
    console.log('Please add MAILGUN_DOMAIN to your .env.local file');
    return;
  }

  if (!fromEmail) {
    console.error('❌ MAILGUN_FROM_EMAIL not found in environment variables');
    console.log('Please add MAILGUN_FROM_EMAIL to your .env.local file');
    return;
  }

  console.log('✅ Environment variables loaded');
  console.log(`📧 Domain: ${domain}`);
  console.log(`📧 From: ${fromEmail}`);
  console.log(`📧 Using sandbox domain: ${domain.includes('sandbox') ? 'Yes' : 'No'}\n`);

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: apiKey,
    // Uncomment if using EU domain:
    // url: "https://api.eu.mailgun.net"
  });

  try {
    console.log('Sending test email...');
    
    const data = await mg.messages.create(domain, {
      from: fromEmail,
      to: ["Max Waring <mooms890@gmail.com>"],
      subject: "SpeedSale Email Test",
      text: "Congratulations! Your SpeedSale email system is working perfectly. You can now send price alerts to your users!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SpeedSale</h1>
            <p style="color: white; margin: 10px 0 0 0;">Email System Test</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Email System Working!</h2>
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your SpeedSale email system is working perfectly. 
              You can now send price alerts to your users when their favorite shoes go on sale.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is a test email from your SpeedSale application.
            </p>
          </div>
        </div>
      `
    });

    console.log('Email sent successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Failed to send email:');
    console.error(error);
  }
}

// Run the test
sendTestEmail().catch(console.error);
