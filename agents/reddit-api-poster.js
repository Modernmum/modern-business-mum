/**
 * REDDIT API POSTER
 * Posts to Reddit using official API (snoowrap)
 * Much more reliable than browser automation
 */

import snoowrap from 'snoowrap';
import { getProducts, createListing } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Initialize Reddit API client
 */
const initReddit = () => {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit API credentials not configured. See REDDIT-API-SETUP.md');
  }

  return new snoowrap({
    userAgent: 'Template Studio Bot v1.0.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
};

/**
 * Generate Reddit post for a product
 */
const generateRedditPost = async (product) => {
  const prompt = `Create a Reddit post for this Notion template product.

Product: ${product.title}
Description: ${product.description}
Price: $${product.suggested_price}
Features: ${product.template_content?.features?.slice(0, 5).join(', ') || 'N/A'}

Requirements:
1. Title: Catchy, helpful, max 300 chars (don't include price)
2. Body: Value-focused, authentic, helpful tone
3. Include 2-3 key benefits/use cases
4. End with soft CTA (not pushy)
5. NO salesy language - be genuinely helpful
6. Format for readability (use line breaks)

Format as JSON:
{
  "title": "...",
  "content": "..."
}`;

  const post = await generateText(prompt, 'json');
  return post;
};

/**
 * Post to Reddit using API
 */
export const postToRedditAPI = async (product, subredditName) => {
  try {
    const reddit = initReddit();

    console.log(`\n📝 Posting to r/${subredditName}...`);

    // Generate post content
    const postContent = await generateRedditPost(product);

    // Get Stripe buy link
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('product_id', product.id)
      .eq('platform', 'stripe')
      .single();

    const buyLink = listings?.url || '#';

    // Add buy link to content
    const fullContent = `${postContent.content}\n\n[Get it here](${buyLink})`;

    // Submit to Reddit
    const submission = await reddit.submitSelfpost({
      subredditName: subredditName,
      title: postContent.title,
      text: fullContent,
    });

    const postUrl = `https://reddit.com${submission.permalink}`;

    console.log(`   ✅ Posted successfully!`);
    console.log(`   📍 ${postUrl}`);

    // Save to database
    await createListing({
      product_id: product.id,
      platform: 'reddit',
      url: postUrl,
      status: 'published',
    });

    return {
      success: true,
      url: postUrl,
      subreddit: subredditName,
    };

  } catch (error) {
    console.error(`   ❌ Failed to post to r/${subredditName}:`, error.message);
    return {
      success: false,
      error: error.message,
      subreddit: subredditName,
    };
  }
};

/**
 * Post product to multiple subreddits
 */
export const postProductToReddit = async (product) => {
  console.log(`\n📌 Processing: ${product.title}\n`);

  const subreddits = product.niche === 'business'
    ? ['Notion', 'productivity', 'Entrepreneur']
    : ['Notion', 'personalfinance', 'FinancialPlanning'];

  const results = [];

  for (const subreddit of subreddits) {
    const result = await postToRedditAPI(product, subreddit);
    results.push(result);

    // Wait 10 minutes between posts (Reddit rate limit)
    if (results.length < subreddits.length) {
      console.log(`   ⏳ Waiting 10 minutes before next post (Reddit rate limit)...`);
      await new Promise(resolve => setTimeout(resolve, 600000)); // 10 min
    }
  }

  return results;
};

/**
 * Main execution - post top 3 products to Reddit
 */
const runRedditCampaign = async () => {
  console.log('\n🚀 REDDIT API POSTER STARTING...\n');

  try {
    // Test credentials
    initReddit();
    console.log('✅ Reddit API credentials valid\n');

    const products = await getProducts();
    const productsToPost = products.slice(0, 3); // Post 3 products

    console.log(`📦 Found ${products.length} products, posting ${productsToPost.length}...\n`);

    const allResults = [];

    for (const product of productsToPost) {
      const results = await postProductToReddit(product);
      allResults.push(...results);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 REDDIT CAMPAIGN SUMMARY:\n');

    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;

    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);

    console.log('\n   Recent posts:');
    allResults.filter(r => r.success).slice(0, 5).forEach(r => {
      console.log(`      • r/${r.subreddit}: ${r.url}`);
    });

    console.log('\n' + '='.repeat(80));

    return allResults;

  } catch (error) {
    console.error('\n❌ Campaign failed:', error.message);

    if (error.message.includes('credentials')) {
      console.log('\n💡 Setup required:');
      console.log('   1. Go to https://www.reddit.com/prefs/apps');
      console.log('   2. Create a script app');
      console.log('   3. Add credentials to .env file');
      console.log('   4. See REDDIT-API-SETUP.md for details\n');
    }

    throw error;
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRedditCampaign()
    .then(() => {
      console.log('\n✅ Reddit campaign complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Campaign failed:', error);
      process.exit(1);
    });
}

export { runRedditCampaign, generateRedditPost };
