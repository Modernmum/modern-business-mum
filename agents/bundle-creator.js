/**
 * BUNDLE CREATOR AGENT
 * Automatically creates product bundles to increase average order value
 *
 * Bundle strategies:
 * - "Starter Pack" - 3 essential templates (20% discount)
 * - "Pro Bundle" - 5 related templates (25% discount)
 * - "Complete Collection" - All templates in a niche (30% discount)
 * - "Cross-Niche Bundle" - Mix of business + finance (25% discount)
 */

import { getProducts, logAction } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Calculate bundle pricing with discount
 */
const calculateBundlePrice = (products, discountPercent) => {
  const totalPrice = products.reduce((sum, p) => sum + parseFloat(p.suggested_price), 0);
  const discountAmount = totalPrice * (discountPercent / 100);
  const bundlePrice = totalPrice - discountAmount;

  return {
    total_price: totalPrice.toFixed(2),
    discount_percent: discountPercent,
    discount_amount: discountAmount.toFixed(2),
    bundle_price: Math.round(bundlePrice), // Round to whole dollar
    savings: discountAmount.toFixed(2),
  };
};

/**
 * Generate bundle title and description using AI
 */
const generateBundleContent = async (products, bundleType) => {
  const prompt = `You are a product marketing expert creating compelling bundle offers.

Bundle Type: ${bundleType}
Products in bundle:
${products.map(p => `- ${p.title}: ${p.description.substring(0, 100)}...`).join('\n')}

Niche: ${products[0].niche}

Create a bundle that:
1. Has a catchy, value-focused title
2. Highlights the synergy between products
3. Emphasizes what customers can achieve with this bundle
4. Makes it feel like a smart investment
5. Creates urgency with scarcity language

Return JSON:
{
  "title": "Bundle name (3-5 words, exciting)",
  "tagline": "One sentence value prop",
  "description": "2-3 sentences explaining why this bundle is perfect",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "perfect_for": "Who should buy this (in one sentence)"
}`;

  const content = await generateText(prompt, 'json');
  return content;
};

/**
 * Create bundle on Stripe
 */
const createStripeBundle = async (bundle, products) => {
  try {
    // Create product on Stripe
    const stripeProduct = await stripe.products.create({
      name: bundle.title,
      description: bundle.description,
      metadata: {
        type: 'bundle',
        product_ids: products.map(p => p.id).join(','),
        niche: products[0].niche,
      },
    });

    // Create price
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(bundle.bundle_price * 100),
      currency: 'usd',
    });

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: stripePrice.id,
        quantity: 1,
      }],
    });

    return {
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
      payment_link: paymentLink.url,
    };

  } catch (error) {
    console.error('Error creating bundle on Stripe:', error);
    throw error;
  }
};

/**
 * Create Starter Pack bundle
 * 3 essential templates, 20% off
 */
const createStarterPack = async (products, niche) => {
  const nicheProducts = products.filter(p => p.niche === niche);

  if (nicheProducts.length < 3) {
    return null; // Not enough products
  }

  // Pick 3 most essential/popular templates
  const bundleProducts = nicheProducts
    .sort((a, b) => a.suggested_price - b.suggested_price) // Start with lower-priced ones
    .slice(0, 3);

  const pricing = calculateBundlePrice(bundleProducts, 20);
  const content = await generateBundleContent(bundleProducts, 'Starter Pack');

  const stripeData = await createStripeBundle(
    { title: content.title, description: content.description, bundle_price: pricing.bundle_price },
    bundleProducts
  );

  return {
    type: 'starter_pack',
    niche,
    products: bundleProducts.map(p => p.id),
    ...content,
    ...pricing,
    ...stripeData,
  };
};

/**
 * Create Pro Bundle
 * 5 related templates, 25% off
 */
const createProBundle = async (products, niche) => {
  const nicheProducts = products.filter(p => p.niche === niche);

  if (nicheProducts.length < 5) {
    return null; // Not enough products
  }

  // Pick 5 complementary templates
  const bundleProducts = nicheProducts.slice(0, 5);

  const pricing = calculateBundlePrice(bundleProducts, 25);
  const content = await generateBundleContent(bundleProducts, 'Pro Bundle');

  const stripeData = await createStripeBundle(
    { title: content.title, description: content.description, bundle_price: pricing.bundle_price },
    bundleProducts
  );

  return {
    type: 'pro_bundle',
    niche,
    products: bundleProducts.map(p => p.id),
    ...content,
    ...pricing,
    ...stripeData,
  };
};

/**
 * Create Complete Collection
 * All templates in a niche, 30% off
 */
const createCompleteCollection = async (products, niche) => {
  const nicheProducts = products.filter(p => p.niche === niche);

  if (nicheProducts.length < 5) {
    return null; // Need at least 5 for "complete" collection
  }

  const bundleProducts = nicheProducts;

  const pricing = calculateBundlePrice(bundleProducts, 30);
  const content = await generateBundleContent(bundleProducts, 'Complete Collection');

  const stripeData = await createStripeBundle(
    { title: content.title, description: content.description, bundle_price: pricing.bundle_price },
    bundleProducts
  );

  return {
    type: 'complete_collection',
    niche,
    products: bundleProducts.map(p => p.id),
    ...content,
    ...pricing,
    ...stripeData,
  };
};

/**
 * Create Cross-Niche Bundle
 * Mix of business + finance, 25% off
 */
const createCrossNicheBundle = async (products) => {
  const businessProducts = products.filter(p => p.niche === 'business').slice(0, 3);
  const financeProducts = products.filter(p => p.niche === 'finance').slice(0, 3);

  if (businessProducts.length < 2 || financeProducts.length < 2) {
    return null; // Need at least 2 of each
  }

  const bundleProducts = [...businessProducts, ...financeProducts];

  const pricing = calculateBundlePrice(bundleProducts, 25);
  const content = await generateBundleContent(bundleProducts, 'Entrepreneur Bundle');

  const stripeData = await createStripeBundle(
    { title: content.title, description: content.description, bundle_price: pricing.bundle_price },
    bundleProducts
  );

  return {
    type: 'cross_niche',
    niche: 'both',
    products: bundleProducts.map(p => p.id),
    ...content,
    ...pricing,
    ...stripeData,
  };
};

/**
 * Main Bundle Creator Agent
 */
export const runBundleCreator = async () => {
  console.log('\n📦 BUNDLE CREATOR AGENT STARTING...\n');

  try {
    await logAction('bundle-creator', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get all listed products
    const products = await getProducts({ status: 'listed' });

    if (products.length < 3) {
      console.log('ℹ️  Not enough products to create bundles (need at least 3).');
      return { bundles_created: 0 };
    }

    console.log(`📊 Found ${products.length} products. Creating bundles...\n`);

    const bundles = [];

    // Create Business Starter Pack
    console.log('  📦 Creating Business Starter Pack...');
    const businessStarter = await createStarterPack(products, 'business');
    if (businessStarter) {
      bundles.push(businessStarter);
      console.log(`  ✅ Created: ${businessStarter.title} - $${businessStarter.bundle_price}`);
    }

    // Create Finance Starter Pack
    console.log('  📦 Creating Finance Starter Pack...');
    const financeStarter = await createStarterPack(products, 'finance');
    if (financeStarter) {
      bundles.push(financeStarter);
      console.log(`  ✅ Created: ${financeStarter.title} - $${financeStarter.bundle_price}`);
    }

    // Create Business Pro Bundle
    console.log('  📦 Creating Business Pro Bundle...');
    const businessPro = await createProBundle(products, 'business');
    if (businessPro) {
      bundles.push(businessPro);
      console.log(`  ✅ Created: ${businessPro.title} - $${businessPro.bundle_price}`);
    }

    // Create Finance Pro Bundle
    console.log('  📦 Creating Finance Pro Bundle...');
    const financePro = await createProBundle(products, 'finance');
    if (financePro) {
      bundles.push(financePro);
      console.log(`  ✅ Created: ${financePro.title} - $${financePro.bundle_price}`);
    }

    // Create Business Complete Collection
    console.log('  📦 Creating Business Complete Collection...');
    const businessComplete = await createCompleteCollection(products, 'business');
    if (businessComplete) {
      bundles.push(businessComplete);
      console.log(`  ✅ Created: ${businessComplete.title} - $${businessComplete.bundle_price}`);
    }

    // Create Finance Complete Collection
    console.log('  📦 Creating Finance Complete Collection...');
    const financeComplete = await createCompleteCollection(products, 'finance');
    if (financeComplete) {
      bundles.push(financeComplete);
      console.log(`  ✅ Created: ${financeComplete.title} - $${financeComplete.bundle_price}`);
    }

    // Create Cross-Niche Bundle
    console.log('  📦 Creating Entrepreneur Bundle (Business + Finance)...');
    const crossNiche = await createCrossNicheBundle(products);
    if (crossNiche) {
      bundles.push(crossNiche);
      console.log(`  ✅ Created: ${crossNiche.title} - $${crossNiche.bundle_price}`);
    }

    // Save bundles to database
    if (bundles.length > 0) {
      // Save to Supabase (we'll create a bundles table)
      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/bundles`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(bundles.map(b => ({
            type: b.type,
            niche: b.niche,
            title: b.title,
            description: b.description,
            tagline: b.tagline,
            benefits: b.benefits,
            perfect_for: b.perfect_for,
            product_ids: b.products,
            total_price: parseFloat(b.total_price),
            discount_percent: b.discount_percent,
            bundle_price: b.bundle_price,
            savings: parseFloat(b.savings),
            stripe_product_id: b.stripe_product_id,
            stripe_price_id: b.stripe_price_id,
            payment_link: b.payment_link,
            status: 'active',
          })))
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.log('⚠️  Could not save bundles to database (table may not exist yet)');
        console.log('   Run: CREATE TABLE bundles (...) in Supabase');
      }
    }

    console.log(`\n✅ Bundle Creator Agent completed`);
    console.log(`📊 Bundles created: ${bundles.length}\n`);

    await logAction('bundle-creator', 'run_completed', 'success', {
      bundles_created: bundles.length,
      timestamp: new Date().toISOString(),
    });

    return {
      bundles_created: bundles.length,
      bundles,
    };

  } catch (error) {
    console.error('❌ Bundle Creator Agent failed:', error.message);
    await logAction('bundle-creator', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runBundleCreator()
    .then((result) => {
      console.log('\n📊 BUNDLE SUMMARY:');
      console.log(`   Bundles created: ${result.bundles_created}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bundle Creator Error:', error);
      process.exit(1);
    });
}

export default { runBundleCreator };
