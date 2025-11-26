/**
 * EMAIL MARKETING AGENT
 * Builds email list and sends automated marketing campaigns
 *
 * Features:
 * - Welcome email sequence for new buyers
 * - Abandoned cart recovery (future)
 * - Product recommendations
 * - Newsletter campaigns
 * - Upsell emails after purchase
 */

import { generateText } from '../lib/ai.js';
import { logAction } from '../lib/database.js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'noreply@modernbusinessmum.com';
const FROM_NAME = 'Modern Business';

/**
 * Send welcome email to new customer
 */
export const sendWelcomeEmail = async (customerEmail, productTitle, downloadLink) => {
  try {
    const welcomeContent = await generateText(`
You are an email marketing expert writing a warm, friendly welcome email.

Customer just purchased: ${productTitle}

Write a welcome email that:
1. Thanks them for their purchase
2. Confirms what they bought
3. Provides value (quick tip to get started)
4. Builds excitement about using the template
5. Mentions they'll get tips and new releases
6. Keep it under 150 words, friendly and conversational

Return JSON:
{
  "subject": "Welcome! Your ${productTitle} is ready",
  "body": "Email body in plain text",
  "html": "Email body in HTML with <p>, <strong>, etc."
}
`, 'json');

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: welcomeContent.subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; }
    .button { display: inline-block; background: #1f2937; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Modern Business!</h1>
    </div>
    <div class="content">
      ${welcomeContent.html}

      <p><a href="${downloadLink}" class="button">Download Your Template</a></p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p><strong>Need help?</strong> Reply to this email and we'll assist you!</p>

      <p style="margin-top: 30px;">
        <strong>💡 Quick Start Tip:</strong> Duplicate the template in Notion before customizing so you always have the original as a backup!
      </p>
    </div>
    <div class="footer">
      <p>Modern Business | Premium Notion Templates</p>
      <p>You're receiving this because you purchased from modernbusinessmum.com</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    await logAction('email-marketer', 'welcome_email_sent', 'success', {
      email: customerEmail,
      product: productTitle,
      email_id: data.id,
    });

    return { success: true, email_id: data.id };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    await logAction('email-marketer', 'welcome_email_failed', 'error', {
      email: customerEmail,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send upsell email after purchase
 * Recommends related templates based on what they bought
 */
export const sendUpsellEmail = async (customerEmail, purchasedProduct, relatedProducts) => {
  try {
    const upsellContent = await generateText(`
You are an email marketing expert creating a value-focused upsell email.

Customer just bought: ${purchasedProduct.title} (${purchasedProduct.niche} niche)

Related products they might like:
${relatedProducts.map(p => `- ${p.title}: ${p.description.substring(0, 100)}... ($${p.suggested_price})`).join('\n')}

Write an email that:
1. Doesn't feel salesy - leads with value
2. Suggests these templates complement what they bought
3. Explains how the bundle saves time
4. Makes it feel like a helpful recommendation from a friend
5. Keep it under 200 words

Return JSON:
{
  "subject": "Love ${purchasedProduct.title}? You might like these too...",
  "body": "Email body in plain text",
  "html": "Email body in HTML"
}
`, 'json');

    const productsHtml = relatedProducts.map(p => `
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">${p.title}</h3>
        <p style="color: #666; margin: 0 0 15px 0;">${p.description.substring(0, 150)}...</p>
        <p style="margin: 0;">
          <strong style="font-size: 18px; color: #10b981;">$${p.suggested_price}</strong>
          <a href="${p.listing_url || 'https://modernbusinessmum.com'}" style="float: right; background: #1f2937; color: white; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View Template</a>
        </p>
      </div>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: upsellContent.subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: white; padding: 30px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${upsellContent.html}

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <h2 style="color: #1f2937;">Recommended For You:</h2>

      ${productsHtml}

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <em>Not interested? No worries! We'll only send you occasional updates about new templates.</em>
      </p>
    </div>
    <div class="footer">
      <p>Modern Business | Premium Notion Templates</p>
      <p><a href="https://modernbusinessmum.com" style="color: #666;">Visit our store</a></p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    await logAction('email-marketer', 'upsell_email_sent', 'success', {
      email: customerEmail,
      purchased_product: purchasedProduct.title,
      recommended_products: relatedProducts.map(p => p.title),
      email_id: data.id,
    });

    return { success: true, email_id: data.id };

  } catch (error) {
    console.error('❌ Error sending upsell email:', error);
    await logAction('email-marketer', 'upsell_email_failed', 'error', {
      email: customerEmail,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send weekly newsletter with tips and new templates
 */
export const sendNewsletterCampaign = async (subscribers, newProducts) => {
  try {
    const newsletterContent = await generateText(`
You are an email marketing expert creating a valuable weekly newsletter.

This week's new templates:
${newProducts.map(p => `- ${p.title}: ${p.description.substring(0, 80)}... ($${p.suggested_price})`).join('\n')}

Write a newsletter that:
1. Provides 1-2 actionable productivity tips
2. Showcases the new templates (but doesn't feel salesy)
3. Shares a "template of the week" spotlight
4. Keeps readers engaged and looking forward to next week
5. Conversational and friendly tone
6. Around 250-300 words

Return JSON:
{
  "subject": "This week: [Catchy hook about the main tip or template]",
  "body": "Email body in plain text",
  "html": "Email body in HTML with sections clearly marked"
}
`, 'json');

    const results = [];

    for (const subscriber of subscribers) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: subscriber.email,
          subject: newsletterContent.subject,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 30px; text-align: center; }
    .content { background: white; padding: 30px; }
    .product-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💡 Modern Business Weekly</h1>
      <p style="opacity: 0.9;">Your weekly dose of productivity</p>
    </div>
    <div class="content">
      ${newsletterContent.html}

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <h2>🆕 This Week's New Templates</h2>

      ${newProducts.map(p => `
        <div class="product-card">
          <h3 style="margin: 0 0 10px 0;">${p.title}</h3>
          <p style="color: #666; margin: 0 0 10px 0;">${p.description.substring(0, 120)}...</p>
          <p style="margin: 0;">
            <strong style="color: #10b981;">$${p.suggested_price}</strong>
            <a href="${p.listing_url || 'https://modernbusinessmum.com'}" style="float: right; color: #1f2937; text-decoration: none; font-weight: bold;">Learn More →</a>
          </p>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <p>Modern Business | Premium Notion Templates</p>
      <p><a href="https://modernbusinessmum.com" style="color: #666;">Visit Store</a> | <a href="mailto:hello@modernbusinessmum.com?subject=Unsubscribe" style="color: #666;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
          `,
        });

        if (error) {
          results.push({ email: subscriber.email, success: false, error: error.message });
        } else {
          results.push({ email: subscriber.email, success: true, email_id: data.id });
        }

        // Rate limit: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({ email: subscriber.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    await logAction('email-marketer', 'newsletter_campaign_sent', 'success', {
      total_subscribers: subscribers.length,
      successful_sends: successCount,
      failed_sends: subscribers.length - successCount,
    });

    return {
      success: true,
      total: subscribers.length,
      sent: successCount,
      failed: subscribers.length - successCount,
      results,
    };

  } catch (error) {
    console.error('❌ Error sending newsletter:', error);
    await logAction('email-marketer', 'newsletter_campaign_failed', 'error', {
      error: error.message,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Main Email Marketing Agent
 * Runs periodic campaigns
 */
export const runEmailMarketer = async () => {
  console.log('\n📧 EMAIL MARKETING AGENT STARTING...\n');

  try {
    await logAction('email-marketer', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // For now, we'll just log that the agent is ready
    // Email sending will be triggered by purchase webhooks and manual campaigns

    console.log('✅ Email Marketing Agent initialized');
    console.log('📧 Ready to send:');
    console.log('   - Welcome emails (triggered by purchases)');
    console.log('   - Upsell emails (3 days after purchase)');
    console.log('   - Newsletter campaigns (weekly)');
    console.log('   - Product launch announcements\n');

    await logAction('email-marketer', 'run_completed', 'success', {
      timestamp: new Date().toISOString(),
    });

    return { initialized: true };

  } catch (error) {
    console.error('❌ Email Marketing Agent failed:', error.message);
    await logAction('email-marketer', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Export functions for use in webhooks and other agents
export default {
  runEmailMarketer,
  sendWelcomeEmail,
  sendUpsellEmail,
  sendNewsletterCampaign,
};
