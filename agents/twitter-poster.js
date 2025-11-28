/**
 * TWITTER AUTO-POSTER AGENT
 * Posts products to Twitter/X using official API
 * FULLY AUTOMATED - No manual intervention needed
 */

import { TwitterApi } from 'twitter-api-v2';
import { getProducts } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const rwClient = twitterClient.readWrite;

/**
 * Generate Tweet for a product
 */
const generateTweet = async (product) => {
  const prompt = `Create a Twitter post for this Notion template product.

Product: ${product.title}
Price: $${product.suggested_price}
Description: ${product.description}
Features: ${product.template_content?.features?.slice(0, 3).join(', ') || 'N/A'}

Requirements:
1. Max 200 characters (leave room for link)
2. Include 2-3 relevant hashtags (#Notion #Productivity)
3. Be engaging and benefit-focused
4. NO price in tweet

Output ONLY the tweet text, nothing else. No JSON, no formatting, just the tweet.`;

  const response = await generateText(prompt, 'text');
  return response.trim();
};

/**
 * Post a product to Twitter
 */
const postToTwitter = async (product) => {
  console.log(`\n🐦 Tweeting: ${product.title}`);

  try {
    // Generate tweet
    const tweetText = await generateTweet(product);

    // Get the Stripe link from listings
    const buyLink = product.listings?.[0]?.url || `https://modernbusinessmum.com/shop`;

    // Add link to tweet
    const fullTweet = `${tweetText}\n\n${buyLink}`;

    // Post to Twitter
    const tweet = await rwClient.v2.tweet(fullTweet);

    console.log(`  ✅ Tweet posted: https://twitter.com/user/status/${tweet.data.id}`);

    return {
      success: true,
      tweetId: tweet.data.id,
      url: `https://twitter.com/user/status/${tweet.data.id}`,
      text: fullTweet
    };

  } catch (error) {
    console.error(`  ❌ Error posting to Twitter:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Main execution - post products to Twitter
 */
const runTwitterCampaign = async () => {
  console.log('\\n🚀 TWITTER AUTO-POSTER STARTING...\\n');

  // Get products with listings
  const allProducts = await getProducts({ status: 'listed', limit: 100 });

  // Take 5 products to tweet
  const productsToTweet = allProducts.slice(0, 5);

  console.log(`📦 Found ${allProducts.length} products, tweeting ${productsToTweet.length}...\\n`);

  const results = [];

  for (const product of productsToTweet) {
    const result = await postToTwitter(product);
    results.push(result);

    // Delay between tweets (Twitter rate limits)
    if (productsToTweet.indexOf(product) < productsToTweet.length - 1) {
      console.log('  ⏳ Waiting 30 seconds before next tweet...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
    }
  }

  // Summary
  console.log('\\n' + '='.repeat(80));
  console.log('\\n📊 TWITTER CAMPAIGN SUMMARY:\\n');

  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successfully tweeted: ${successful}/${results.length} products`);

  if (successful > 0) {
    console.log('\\n🔗 Tweet URLs:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.url}`);
    });
  }

  console.log('\\n' + '='.repeat(80));

  return results;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTwitterCampaign()
    .then(() => {
      console.log('\\n✅ Twitter campaign complete\\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\\n❌ Campaign failed:', error);
      process.exit(1);
    });
}

export { runTwitterCampaign, postToTwitter };
