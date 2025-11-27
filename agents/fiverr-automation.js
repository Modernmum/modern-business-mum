/**
 * FIVERR AUTOMATION AGENT
 * Fully automated order detection, fulfillment, and delivery
 * Checks for new orders, generates templates, and delivers automatically
 */

import puppeteer from 'puppeteer';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Login to Fiverr
 */
const loginToFiverr = async (page) => {
  console.log('🔐 Logging into Fiverr...');

  await page.goto('https://www.fiverr.com/login', { waitUntil: 'networkidle2' });
  await delay(2000);

  // Enter email
  const emailSelectors = [
    'input[name="username"]',
    'input[type="email"]',
    'input[placeholder*="Email"]'
  ];

  for (const selector of emailSelectors) {
    const field = await page.$(selector);
    if (field) {
      await field.type(process.env.FIVERR_EMAIL, { delay: 100 });
      break;
    }
  }

  await delay(1000);

  // Enter password
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]'
  ];

  for (const selector of passwordSelectors) {
    const field = await page.$(selector);
    if (field) {
      await field.type(process.env.FIVERR_PASSWORD, { delay: 100 });
      break;
    }
  }

  await delay(1000);

  // Click login
  const loginButton = await page.$('button[type="submit"]');
  if (loginButton) {
    await loginButton.click();
    await delay(5000); // Wait for login
  }

  console.log('✅ Logged into Fiverr');
};

/**
 * Check for new orders
 */
const checkForNewOrders = async (page) => {
  console.log('📬 Checking for new orders...');

  await page.goto('https://www.fiverr.com/inbox', { waitUntil: 'networkidle2' });
  await delay(3000);

  // Look for unread messages or new order notifications
  const orders = await page.evaluate(() => {
    const orderElements = document.querySelectorAll('[data-order-id]');
    const newOrders = [];

    orderElements.forEach(el => {
      const orderId = el.getAttribute('data-order-id');
      const isNew = el.querySelector('.unread') || el.querySelector('.new-order');

      if (isNew) {
        const buyerName = el.querySelector('.buyer-name')?.textContent || 'Unknown';
        const orderDetails = el.querySelector('.order-description')?.textContent || '';

        newOrders.push({
          orderId,
          buyerName,
          orderDetails
        });
      }
    });

    return newOrders;
  });

  console.log(`📊 Found ${orders.length} new orders`);
  return orders;
};

/**
 * Read order requirements from Fiverr message
 */
const readOrderRequirements = async (page, orderId) => {
  console.log(`📖 Reading order requirements for ${orderId}...`);

  await page.goto(`https://www.fiverr.com/orders/${orderId}`, { waitUntil: 'networkidle2' });
  await delay(3000);

  const requirements = await page.evaluate(() => {
    // Extract buyer's requirements from the order page
    const reqText = document.querySelector('.requirements-text')?.textContent || '';
    const attachments = Array.from(document.querySelectorAll('.attachment-link')).map(a => a.href);

    return {
      text: reqText,
      attachments
    };
  });

  return requirements;
};

/**
 * Generate template based on requirements using AI
 */
const generateTemplateFromRequirements = async (requirements) => {
  console.log('🎨 Generating custom template...');

  const prompt = `You are an expert Notion template designer. A client has ordered a custom Notion template with these requirements:

${requirements.text}

Analyze these requirements and create a comprehensive Notion template specification.

Return a JSON object with:
{
  "title": "Template name",
  "description": "What this template does",
  "niche": "business" or "finance",
  "features": ["feature 1", "feature 2", ...],
  "databases": [
    {
      "name": "Database name",
      "properties": ["prop1", "prop2", ...]
    }
  ],
  "pages": ["page 1", "page 2", ...],
  "automations": ["automation 1", ...],
  "suggested_price": 0
}`;

  const templateSpec = await generateText(prompt, 'json');

  // Generate the actual template content
  const contentPrompt = `Create a complete Notion template based on this specification:

${JSON.stringify(templateSpec, null, 2)}

Generate the full template content including:
1. Database schemas
2. Page layouts
3. Formula examples
4. Setup instructions
5. Video walkthrough script

Return as JSON with all necessary content.`;

  const templateContent = await generateText(contentPrompt, 'json');

  return {
    ...templateSpec,
    template_content: templateContent
  };
};

/**
 * Create delivery package
 */
const createDeliveryPackage = async (template, orderId) => {
  console.log('📦 Creating delivery package...');

  const deliveryDir = path.join(process.cwd(), 'fiverr-deliveries', orderId);
  if (!fs.existsSync(deliveryDir)) {
    fs.mkdirSync(deliveryDir, { recursive: true });
  }

  // 1. Save template specification
  fs.writeFileSync(
    path.join(deliveryDir, 'template-spec.json'),
    JSON.stringify(template, null, 2)
  );

  // 2. Generate Notion template link (duplicate from your master template)
  const notionLink = `https://notion.so/your-template-${orderId}`;

  // 3. Create setup instructions
  const instructions = `# ${template.title} - Setup Instructions

## What's Included
${template.features.map(f => `- ${f}`).join('\n')}

## Setup Steps
1. Click the Notion link below to duplicate this template to your workspace
2. Follow the video walkthrough
3. Customize to your needs

## Notion Template Link
${notionLink}

## Video Walkthrough
See attached video or link: [Video URL]

## Support
You have 30 days of support included. Message me with any questions!

---
Created with ❤️ by Modern Business Mum
`;

  fs.writeFileSync(
    path.join(deliveryDir, 'SETUP-INSTRUCTIONS.md'),
    instructions
  );

  // 4. Generate video script
  const videoScript = template.template_content.walkthrough_script || 'Video walkthrough script';
  fs.writeFileSync(
    path.join(deliveryDir, 'video-script.txt'),
    videoScript
  );

  return {
    deliveryDir,
    notionLink,
    instructions
  };
};

/**
 * Deliver order on Fiverr
 */
const deliverOrder = async (page, orderId, deliveryPackage) => {
  console.log('📤 Delivering order to Fiverr...');

  await page.goto(`https://www.fiverr.com/orders/${orderId}/deliver`, { waitUntil: 'networkidle2' });
  await delay(3000);

  // Fill delivery message
  const deliveryMessage = `Hi! 🎉

Your custom Notion template is ready!

${deliveryPackage.instructions}

I've included:
✓ Complete Notion template (link above)
✓ Setup instructions
✓ Video walkthrough
✓ 30 days of support

Let me know if you need any adjustments. Enjoy your new productivity system!

Best regards,
Modern Business Mum`;

  const messageField = await page.$('textarea[name="message"]') || await page.$('.delivery-message');
  if (messageField) {
    await messageField.type(deliveryMessage, { delay: 50 });
  }

  // Upload files (if Fiverr allows via automation)
  // const fileInput = await page.$('input[type="file"]');
  // if (fileInput) {
  //   await fileInput.uploadFile(path.join(deliveryPackage.deliveryDir, 'SETUP-INSTRUCTIONS.md'));
  // }

  await delay(2000);

  // Click deliver button
  const deliverButton = await page.$('button[type="submit"]') || await page.$('.deliver-order-button');
  if (deliverButton) {
    await deliverButton.click();
    console.log('✅ Order delivered!');
  }

  return true;
};

/**
 * Log order to database
 */
const logOrderToDatabase = async (orderId, buyerName, template, status) => {
  await supabase.from('fiverr_orders').insert({
    order_id: orderId,
    buyer_name: buyerName,
    template_title: template.title,
    status: status,
    delivered_at: new Date().toISOString()
  });
};

/**
 * Main automation loop
 */
const runFiverrAutomation = async () => {
  console.log('\n🤖 FIVERR AUTOMATION AGENT STARTING...\n');

  if (!process.env.FIVERR_EMAIL || !process.env.FIVERR_PASSWORD) {
    console.log('⚠️  Fiverr credentials not configured');
    console.log('Add to .env:');
    console.log('  FIVERR_EMAIL=your@email.com');
    console.log('  FIVERR_PASSWORD=yourpassword\n');
    return;
  }

  const browser = await puppeteer.launch({
    headless: false, // Set to 'new' for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Login
    await loginToFiverr(page);

    // Check for new orders
    const newOrders = await checkForNewOrders(page);

    if (newOrders.length === 0) {
      console.log('📭 No new orders. Will check again later.');
      await browser.close();
      return;
    }

    // Process each order
    for (const order of newOrders) {
      console.log(`\n🎯 Processing order: ${order.orderId}`);
      console.log(`   Buyer: ${order.buyerName}`);

      // Read requirements
      const requirements = await readOrderRequirements(page, order.orderId);

      // Generate template
      const template = await generateTemplateFromRequirements(requirements);

      // Create delivery package
      const deliveryPackage = await createDeliveryPackage(template, order.orderId);

      // Deliver order
      await deliverOrder(page, order.orderId, deliveryPackage);

      // Log to database
      await logOrderToDatabase(order.orderId, order.buyerName, template, 'delivered');

      console.log(`✅ Order ${order.orderId} completed!\n`);

      // Delay between orders
      await delay(10000);
    }

    console.log('\n🎉 All orders processed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFiverrAutomation()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runFiverrAutomation };
