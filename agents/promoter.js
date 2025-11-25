/**
 * PROMOTER AGENT
 * Automatically promotes new products on social media platforms
 */

import { CONFIG } from '../config/settings.js';
import { getProducts, logAction } from '../lib/database.js';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate social media content for a product
 */
const generateSocialContent = async (product) => {
  const prompt = `Create engaging social media posts for this Notion template:

PRODUCT: ${product.title}
PRICE: $${product.suggested_price}
NICHE: ${product.niche}
FEATURES: ${product.features.slice(0, 5).join(', ')}

Generate 3 posts:
1. TWITTER/X (280 chars max, include emojis and hashtags)
2. TIKTOK CAPTION (short, catchy, viral-worthy with trending hooks)
3. INSTAGRAM CAPTION (engaging, story-driven, with relevant hashtags)

Format as JSON:
{
  "twitter": "post text",
  "tiktok": "caption text",
  "instagram": "caption text",
  "hooks": ["hook1", "hook2", "hook3"]
}`;

  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].text;
  let jsonText = responseText;

  if (responseText.includes('```json')) {
    jsonText = responseText.split('```json')[1].split('```')[0].trim();
  } else if (responseText.includes('```')) {
    jsonText = responseText.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonText);
};

/**
 * Main Promoter Agent execution
 */
export const runPromoter = async () => {
  console.log('\n📣 PROMOTER AGENT STARTING...\n');

  try {
    await logAction('promoter', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get recently listed products that haven't been promoted
    const products = await getProducts({ status: 'listed', limit: 5 });

    if (products.length === 0) {
      console.log('ℹ️  No new products to promote.');
      return { promoted: 0 };
    }

    console.log(`🎯 Generating social content for ${products.length} products...\n`);

    const promotions = [];

    for (const product of products) {
      try {
        console.log(`  Creating posts for: ${product.title}`);

        const socialContent = await generateSocialContent(product);

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

        // Create promotional content
        const promotion = {
          product,
          content: {
            twitter: socialContent.twitter + `\n\n🔗 ${buyLink}`,
            tiktok: socialContent.tiktok,
            instagram: socialContent.instagram + `\n\nLink in bio! 🔗`,
            hooks: socialContent.hooks
          },
          buyLink
        };

        promotions.push(promotion);

        console.log(`  ✅ Content generated`);
        console.log(`     Twitter: ${socialContent.twitter.substring(0, 60)}...`);
        console.log(`     TikTok: ${socialContent.tiktok.substring(0, 60)}...`);

        // Log promotion
        await logAction('promoter', 'content_generated', 'success', {
          product_id: product.id,
          title: product.title,
          platforms: ['twitter', 'tiktok', 'instagram']
        });

      } catch (error) {
        console.error(`  ❌ Error promoting ${product.title}:`, error.message);
        await logAction('promoter', 'promotion_failed', 'error', {
          product_id: product.id,
          error: error.message,
        });
      }
    }

    // Save all promotions to file
    const fs = await import('fs');
    const path = await import('path');

    const promotionsDir = path.join(process.cwd(), 'promotions');
    if (!fs.existsSync(promotionsDir)) {
      fs.mkdirSync(promotionsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promotions-${timestamp}.json`;
    const filepath = path.join(promotionsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(promotions, null, 2));

    console.log(`\n✅ Promoter Agent completed`);
    console.log(`📁 Promotions saved to: ${filename}\n`);

    await logAction('promoter', 'run_completed', 'success', {
      promoted_count: promotions.length,
      timestamp: new Date().toISOString(),
    });

    return {
      promoted: promotions.length,
      promotions,
      filepath
    };

  } catch (error) {
    console.error('❌ Promoter Agent failed:', error.message);
    await logAction('promoter', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runPromoter()
    .then((result) => {
      console.log('\n📊 PROMOTION SUMMARY:');
      console.log(`   Products promoted: ${result.promoted}`);
      console.log(`   File saved: ${result.filepath}`);

      // Display one example
      if (result.promotions.length > 0) {
        const example = result.promotions[0];
        console.log(`\n📱 EXAMPLE - ${example.product.title}:`);
        console.log(`\n   TWITTER:\n   ${example.content.twitter}`);
        console.log(`\n   TIKTOK:\n   ${example.content.tiktok}`);
        console.log(`\n   BUY LINK:\n   ${example.buyLink}`);
      }

      process.exit(0);
    })
    .catch((error) => {
      console.error('Promoter Error:', error);
      process.exit(1);
    });
}

export default { runPromoter };
