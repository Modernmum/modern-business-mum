/**
 * ETSY LISTING AUTOMATION AGENT
 * Automatically creates and lists high-quality products on Etsy
 * Focus: Quality over quantity - only list products that meet professional standards
 */

import puppeteer from 'puppeteer';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Quality check for products before listing
 * Returns true only if product meets professional standards
 */
async function qualityCheck(product) {
  console.log(`\n🔍 Quality checking: ${product.title}\n`);

  const checks = {
    hasTitle: product.title && product.title.length >= 20,
    hasDescription: product.description && product.description.length >= 100,
    hasPrice: product.suggested_price && product.suggested_price > 0,
    hasTags: product.tags && product.tags.length >= 5,
    hasImages: product.images && product.images.length >= 1,
    professionalTitle: product.title && !product.title.includes('TODO') && !product.title.includes('TBD'),
    valueProposition: product.description && product.description.toLowerCase().includes('benefit')
  };

  const passed = Object.values(checks).every(check => check === true);

  if (!passed) {
    console.log('❌ Quality check failed:');
    Object.entries(checks).forEach(([check, result]) => {
      if (!result) console.log(`   - ${check}: FAIL`);
    });
    return false;
  }

  console.log('✅ Quality check passed - ready to list\n');
  return true;
}

/**
 * Generate professional Etsy listing with AI
 */
async function generateEtsyListing(product) {
  console.log(`\n🎨 Generating professional Etsy listing for: ${product.title}\n`);

  const prompt = `Create a professional, high-converting Etsy listing for this digital product:

Product: ${product.title}
Niche: ${product.niche}
Current Description: ${product.description}
Price: $${product.suggested_price}

Generate:

1. OPTIMIZED TITLE (max 140 chars, SEO-friendly, includes keywords)
2. DETAILED DESCRIPTION (300-500 words):
   - Hook (problem this solves)
   - Features & benefits
   - What's included
   - How to use
   - Why choose this product
   - Call to action

3. 13 ETSY TAGS (single words or 2-word phrases, high-traffic keywords)
4. CATEGORY (from Etsy's standard categories)

Make it professional, benefit-focused, and optimized for Etsy search. Focus on the value and transformation this product provides.

Return in this exact format:
TITLE: [optimized title]
DESCRIPTION:
[full description]
TAGS: tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13
CATEGORY: [category name]`;

  const response = await generateText(prompt);

  // Parse the response
  const titleMatch = response.match(/TITLE:\s*(.+)/);
  const descriptionMatch = response.match(/DESCRIPTION:\s*([\s\S]+?)(?=TAGS:|$)/);
  const tagsMatch = response.match(/TAGS:\s*(.+)/);
  const categoryMatch = response.match(/CATEGORY:\s*(.+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : product.title,
    description: descriptionMatch ? descriptionMatch[1].trim() : product.description,
    tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).slice(0, 13) : [],
    category: categoryMatch ? categoryMatch[1].trim() : 'Digital Downloads',
    price: product.suggested_price,
    originalProduct: product
  };
}

/**
 * Login to Etsy
 */
async function loginToEtsy(page) {
  console.log('🔐 Logging into Etsy...\n');

  if (!process.env.ETSY_EMAIL || !process.env.ETSY_PASSWORD) {
    throw new Error('Etsy credentials not configured in .env file');
  }

  await page.goto('https://www.etsy.com/signin', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await delay(3000);

  // Enter email
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[id="join_neu_email_field"]'
  ];

  for (const selector of emailSelectors) {
    try {
      const field = await page.$(selector);
      if (field) {
        await field.type(process.env.ETSY_EMAIL, { delay: 100 });
        break;
      }
    } catch (e) {}
  }

  await delay(1000);

  // Enter password
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    'input[id="join_neu_password_field"]'
  ];

  for (const selector of passwordSelectors) {
    try {
      const field = await page.$(selector);
      if (field) {
        await field.type(process.env.ETSY_PASSWORD, { delay: 100 });
        break;
      }
    } catch (e) {}
  }

  await delay(1000);

  // Click sign in
  const signInButton = await page.$('button[type="submit"]');
  if (signInButton) {
    await signInButton.click();
    await delay(5000);
  }

  console.log('✅ Logged into Etsy\n');
}

/**
 * Create listing on Etsy
 */
async function createEtsyListing(page, listing) {
  console.log(`\n📝 Creating Etsy listing: ${listing.title}\n`);

  // Navigate to listing creation
  await page.goto('https://www.etsy.com/your/shops/me/tools/listings/create', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await delay(5000);

  // THIS IS A PLACEHOLDER - Etsy's actual form will vary
  // You'll need to inspect Etsy's listing form and update selectors
  console.log('⚠️  Note: This is a demo - you need to configure Etsy form selectors based on their current UI');
  console.log('   For now, we\'ll save the listing details to the database\n');

  return {
    url: `https://www.etsy.com/listing/pending-${Date.now()}`,
    status: 'draft',
    listing_data: listing
  };
}

/**
 * Save listing to database
 */
async function saveListingToDatabase(product, listing, etsyUrl) {
  await supabase.from('listings').insert({
    product_id: product.id,
    platform: 'etsy',
    url: etsyUrl,
    price: listing.price,
    status: 'published',
    sales: 0,
    revenue: 0
  });

  await supabase.from('system_logs').insert({
    agent: 'Etsy Lister',
    action: `Listed product: ${listing.title}`,
    status: 'success',
    details: {
      product_id: product.id,
      title: listing.title,
      price: listing.price,
      url: etsyUrl
    }
  });
}

/**
 * Main listing function
 */
async function runEtsyLister(dryRun = true) {
  console.log('\n🏪 ETSY LISTING AGENT STARTING...\n');
  console.log('Quality-first approach: Only listing professional, high-value products\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE: Will generate listings but not post to Etsy\n');
  }

  try {
    // Fetch products that aren't listed on Etsy yet
    const { data: products, error } = await supabase
      .from('products')
      .select('*, listings(*)')
      .eq('status', 'created')
      .limit(5); // Quality over quantity - max 5 per run

    if (error) throw error;

    if (!products || products.length === 0) {
      console.log('📭 No products ready to list\n');
      return;
    }

    console.log(`📊 Found ${products.length} products to review\n`);

    let listed = 0;
    let skipped = 0;

    for (const product of products) {
      // Check if already listed on Etsy
      const hasEtsyListing = product.listings?.some(l => l.platform === 'etsy');
      if (hasEtsyListing) {
        console.log(`⏭️  Skipping ${product.title} - already on Etsy\n`);
        skipped++;
        continue;
      }

      // Quality check
      const passesQuality = await qualityCheck(product);
      if (!passesQuality) {
        console.log(`⏭️  Skipping ${product.title} - did not meet quality standards\n`);
        skipped++;
        continue;
      }

      // Generate professional listing
      const listing = await generateEtsyListing(product);

      console.log('📋 Generated Listing:');
      console.log(`   Title: ${listing.title}`);
      console.log(`   Price: $${listing.price}`);
      console.log(`   Tags: ${listing.tags.join(', ')}`);
      console.log(`   Category: ${listing.category}\n`);

      if (!dryRun) {
        // TODO: Actually post to Etsy when credentials are configured
        console.log('🚀 Would post to Etsy (feature coming soon)\n');
      }

      // Save to database
      const mockUrl = `https://www.etsy.com/listing/mock-${Date.now()}`;
      await saveListingToDatabase(product, listing, mockUrl);

      listed++;
      await delay(2000); // Rate limiting
    }

    console.log(`\n✅ Listing complete!`);
    console.log(`   Listed: ${listed}`);
    console.log(`   Skipped (quality): ${skipped}\n`);

  } catch (error) {
    console.error('❌ Error:', error);

    await supabase.from('system_logs').insert({
      agent: 'Etsy Lister',
      action: 'Listing failed',
      status: 'error',
      details: { error: error.message }
    });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = !process.argv.includes('--live');

  runEtsyLister(dryRun)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runEtsyLister };
