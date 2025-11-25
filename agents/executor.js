/**
 * EXECUTOR AGENT
 * Lists products on Stripe or generates manual listing instructions
 */

import Stripe from 'stripe';
import { CONFIG } from '../config/settings.js';
import {
  getProducts,
  updateProductStatus,
  createListing,
  logAction,
} from '../lib/database.js';
import { generateListingInstructions } from '../lib/ai.js';

/**
 * Create a listing on Stripe using API
 */
const createStripeListing = async (product) => {
  const stripeApiKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeApiKey) {
    console.log('  ℹ️  No Stripe API key found. Generating manual instructions...');
    return null;
  }

  try {
    const stripe = new Stripe(stripeApiKey);

    // Create a product in Stripe
    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description,
      metadata: {
        niche: product.niche,
        source: 'zero-to-legacy-engine',
      },
    });

    // Create a price for the product
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.suggested_price * 100), // Convert to cents
      currency: 'usd',
    });

    // Create a payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Thank you for your purchase! Check your email for the download link.',
        },
      },
    });

    console.log(`  ✅ Listed on Stripe: ${paymentLink.url}`);

    return {
      url: paymentLink.url,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
      stripe_payment_link_id: paymentLink.id,
      status: 'published',
    };
  } catch (error) {
    console.error('  ❌ Stripe API error:', error.message);
    return null;
  }
};

/**
 * Generate manual listing instructions
 */
const generateManualInstructions = async (product) => {
  try {
    const instructions = await generateListingInstructions(
      product,
      CONFIG.agents.executor.defaultPlatform
    );

    return instructions;
  } catch (error) {
    console.error('  ❌ Error generating instructions:', error.message);

    // Return fallback instructions
    return `
MANUAL LISTING INSTRUCTIONS FOR ${product.title}

1. Go to ${CONFIG.agents.executor.defaultPlatform === 'gumroad' ? 'https://gumroad.com/products/new' : 'your platform'}

2. Product Details:
   - Title: ${product.title}
   - Price: $${product.suggested_price}
   - Category: ${product.niche}

3. Description:
${product.description}

4. Features to highlight:
${product.features.map((f, i) => `   ${i + 1}. ${f}`).join('\n')}

5. Save as ${CONFIG.agents.executor.autoPublish ? 'published' : 'draft'}
    `;
  }
};

/**
 * Main Executor Agent execution
 */
export const runExecutor = async () => {
  console.log('\n🚀 EXECUTOR AGENT STARTING...\n');

  try {
    // Log start
    await logAction('executor', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get created products that need listing
    const products = await getProducts({
      status: 'created',
      limit: CONFIG.agents.executor.maxListingsPerCycle,
    });

    if (products.length === 0) {
      console.log('ℹ️  No products available to list.');
      await logAction('executor', 'run_completed', 'success', {
        listed_count: 0,
        reason: 'no_products',
      });
      return { listed: 0, products: [] };
    }

    console.log(`📋 Listing ${products.length} products...\n`);

    const listed = [];

    for (const product of products) {
      try {
        console.log(`\n  Listing: ${product.title}`);
        console.log(`  Price: $${product.suggested_price} | Niche: ${product.niche}`);

        // Mark product as in progress
        await updateProductStatus(product.id, 'listing');

        // Try to create listing on Stripe
        console.log(`  🔗 Attempting Stripe listing...`);
        const stripeResult = await createStripeListing(product);

        let listing;
        let instructions = null;

        if (stripeResult) {
          // Successful API listing
          console.log(`  📊 Status: ${stripeResult.status}`);

          listing = await createListing({
            product_id: product.id,
            platform: 'stripe',
            url: stripeResult.url,
            price: product.suggested_price,
            status: stripeResult.status,
            sales: 0,
            revenue: 0,
          });

          await updateProductStatus(product.id, 'listed');
        } else {
          // Generate manual instructions
          if (CONFIG.agents.executor.generateInstructions) {
            console.log(`  📝 Generating manual listing instructions...`);
            instructions = await generateManualInstructions(product);
            console.log(`  ✅ Instructions generated`);
          }

          // Create draft listing in database
          listing = await createListing({
            product_id: product.id,
            platform: CONFIG.agents.executor.defaultPlatform,
            url: null,
            price: product.suggested_price,
            status: 'draft',
            sales: 0,
            revenue: 0,
          });

          await updateProductStatus(product.id, 'draft');
        }

        listed.push({
          product,
          listing,
          instructions,
        });

        // Log successful listing
        await logAction('executor', 'product_listed', 'success', {
          product_id: product.id,
          listing_id: listing.id,
          platform: listing.platform,
          status: listing.status,
          url: listing.url,
          has_instructions: !!instructions,
        });

        // Print instructions if generated
        if (instructions) {
          console.log('\n  📋 MANUAL LISTING INSTRUCTIONS:');
          console.log('  ' + instructions.split('\n').join('\n  '));
        }
      } catch (error) {
        console.error(`  ❌ Error listing product ${product.title}:`, error.message);

        // Mark product as failed
        await updateProductStatus(product.id, 'failed');

        await logAction('executor', 'product_listing_failed', 'error', {
          product_id: product.id,
          title: product.title,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Executor Agent completed. Listed: ${listed.length} products\n`);

    // Log completion
    await logAction('executor', 'run_completed', 'success', {
      listed_count: listed.length,
      timestamp: new Date().toISOString(),
    });

    return {
      listed: listed.length,
      products: listed,
    };
  } catch (error) {
    console.error('❌ Executor Agent failed:', error.message);

    await logAction('executor', 'run_failed', 'error', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Get Executor Agent status
 */
export const getExecutorStatus = async () => {
  const products = await getProducts({ status: 'created' });
  const hasGumroadKey = !!process.env.GUMROAD_API_KEY;

  return {
    products_ready_to_list: products.length,
    max_listings_per_cycle: CONFIG.agents.executor.maxListingsPerCycle,
    default_platform: CONFIG.agents.executor.defaultPlatform,
    auto_publish: CONFIG.agents.executor.autoPublish,
    gumroad_api_configured: hasGumroadKey,
  };
};

// Run standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExecutor()
    .then((result) => {
      console.log('Executor Agent Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Executor Agent Error:', error);
      process.exit(1);
    });
}

export default { runExecutor, getExecutorStatus };
