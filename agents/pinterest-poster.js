/**
 * PINTEREST AUTO-POSTER AGENT
 * Automatically creates and posts Pinterest pins for products
 * This is the #1 marketing channel for Notion templates
 */

import { getProducts, logAction } from '../lib/database.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create a Pinterest pin using their API
 */
const createPinterestPin = async (product, buyLink) => {
  if (!process.env.PINTEREST_ACCESS_TOKEN) {
    console.log('  ⚠️  Pinterest API not configured');
    return { success: false, reason: 'no_api_token' };
  }

  try {
    // Pinterest API v5 endpoint
    const pinterestAPI = 'https://api.pinterest.com/v5/pins';

    // Generate pin data
    const pinData = {
      title: `${product.title} - Notion Template`,
      description: generatePinDescription(product, buyLink),
      link: buyLink,
      board_id: process.env.PINTEREST_BOARD_ID, // You'll set this
      media_source: {
        source_type: 'image_url',
        url: `https://modernbusinessmum.com/api/pin-image/${product.id}` // We'll create this endpoint
      }
    };

    // Post to Pinterest
    const response = await axios.post(pinterestAPI, pinData, {
      headers: {
        'Authorization': `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`  ✅ Pin created: ${response.data.id}`);

    return {
      success: true,
      pin_id: response.data.id,
      pin_url: `https://pinterest.com/pin/${response.data.id}`
    };

  } catch (error) {
    console.error(`  ❌ Pinterest API error:`, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Generate SEO-optimized pin description
 */
const generatePinDescription = (product, buyLink) => {
  const keywords = [
    'Notion template',
    'productivity',
    'organization',
    product.niche === 'business' ? 'business' : 'finance',
    'planner',
    'digital download'
  ];

  const description = `${product.title} - Perfect for ${product.niche === 'business' ? 'entrepreneurs & business owners' : 'budgeting & financial planning'}!

✨ Features:
${product.features.slice(0, 3).map(f => `• ${f}`).join('\n')}

💰 Price: $${product.suggested_price}
🔗 Get it now: ${buyLink}

#${keywords.join(' #')}`;

  return description.substring(0, 500); // Pinterest limit
};

/**
 * Main Pinterest Poster Agent
 */
export const runPinterestPoster = async () => {
  console.log('\n📌 PINTEREST POSTER AGENT STARTING...\n');

  try {
    await logAction('pinterest-poster', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get products that need to be pinned
    // For now, get the 5 most recent products
    const products = await getProducts({ status: 'listed', limit: 5 });

    if (products.length === 0) {
      console.log('ℹ️  No products to pin.');
      return { pinned: 0 };
    }

    console.log(`🎯 Creating Pinterest pins for ${products.length} products...\n`);

    const pinResults = [];

    for (const product of products) {
      try {
        console.log(`  📌 Pinning: ${product.title}`);

        // Get the Stripe payment link
        const listingResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/listings?product_id=eq.${product.id}&select=url`,
          {
            headers: {
              'apikey': process.env.SUPABASE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
            }
          }
        );
        const listings = await listingResponse.json();
        const buyLink = listings[0]?.url || 'https://modernbusinessmum.com';

        // Create Pinterest pin
        const result = await createPinterestPin(product, buyLink);

        pinResults.push({
          product_id: product.id,
          title: product.title,
          ...result
        });

        // Log successful pin
        if (result.success) {
          await logAction('pinterest-poster', 'pin_created', 'success', {
            product_id: product.id,
            title: product.title,
            pin_id: result.pin_id
          });
        }

        // Rate limiting: wait 2 seconds between pins
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`  ❌ Error pinning ${product.title}:`, error.message);
        await logAction('pinterest-poster', 'pin_failed', 'error', {
          product_id: product.id,
          error: error.message,
        });
      }
    }

    const successCount = pinResults.filter(r => r.success).length;

    console.log(`\n✅ Pinterest Poster Agent completed`);
    console.log(`📊 Successfully pinned ${successCount}/${products.length} products\n`);

    await logAction('pinterest-poster', 'run_completed', 'success', {
      pinned_count: successCount,
      total_count: products.length,
      timestamp: new Date().toISOString(),
    });

    return {
      pinned: successCount,
      results: pinResults
    };

  } catch (error) {
    console.error('❌ Pinterest Poster Agent failed:', error.message);
    await logAction('pinterest-poster', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runPinterestPoster()
    .then((result) => {
      console.log('\n📊 PINTEREST SUMMARY:');
      console.log(`   Products pinned: ${result.pinned}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Pinterest Poster Error:', error);
      process.exit(1);
    });
}

export default { runPinterestPoster };
