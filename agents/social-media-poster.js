/**
 * SOCIAL MEDIA AUTO-POSTER AGENT
 * Posts to social media platforms using OFFICIAL APIs ONLY
 *
 * ✅ ENABLED: Reddit (via official API)
 * ❌ DISABLED: Facebook (browser automation violates ToS)
 * ❌ DISABLED: LinkedIn (browser automation violates ToS)
 *
 * COMPLIANCE: This script only uses official APIs to comply with platform Terms of Service
 */

import { postProductToReddit } from './reddit-api-poster.js';
import { getProducts, createListing } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import { isPlatformEnabled } from '../config/social-platforms.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Generate platform-specific post content
 */
const generatePlatformPost = async (platform, product) => {
  const platformStyles = {
    reddit: 'casual, helpful, community-focused',
    facebook: 'friendly, engaging, visual-focused',
    linkedin: 'professional, value-driven, business-focused',
  };

  const prompt = `Create a ${platform} post for this Notion template product.

Product: ${product.title}
Description: ${product.description}
Price: $${product.suggested_price}
Features: ${product.template_content?.features?.slice(0, 5).join(', ') || 'N/A'}

Platform Style: ${platformStyles[platform]}

Requirements:
1. ${platform === 'reddit' ? 'Title (max 300 chars) and body text (max 40000 chars)' : 'Post text (max 3000 chars)'}
2. Include benefits and use cases
3. Add a soft call-to-action
4. ${platform === 'linkedin' ? 'Use professional tone with hashtags' : platform === 'facebook' ? 'Use emojis and engaging language' : 'Be authentic and helpful, not salesy'}
5. Do NOT include price in ${platform} posts (save for buy page)

Format as JSON:
{
  ${platform === 'reddit' ? '"title": "...",\n  "content": "..."' : '"content": "..."'}
}`;

  const post = await generateText(prompt, 'json');
  return post;
};

/**
 * Post to Reddit using API (much more reliable than browser automation)
 */
const postToReddit = async (product) => {
  console.log(`\n📝 Posting to Reddit via API: ${product.title}`);

  try {
    // Use Reddit API instead of browser automation
    const results = await postProductToReddit(product);
    return results;
  } catch (error) {
    console.error(`  ❌ Error posting to Reddit:`, error.message);

    if (error.message.includes('credentials')) {
      console.log('\n  ⚠️  Reddit API not configured. See REDDIT-API-SETUP.md');
    }

    return [{ success: false, error: error.message }];
  }
};

/**
 * FACEBOOK POSTING DISABLED
 * Browser automation violates Facebook Terms of Service
 * To post to Facebook legally, use Facebook Graph API with proper permissions
 */
const postToFacebook = async (product) => {
  console.log(`\n👥 Facebook posting: DISABLED (violates ToS)`);
  console.log('   Browser automation is against Facebook Terms of Service');
  console.log('   To post to Facebook, use the official Facebook Graph API');
  return { success: false, reason: 'tos_violation_disabled' };
};

/**
 * LINKEDIN POSTING DISABLED
 * Browser automation violates LinkedIn Terms of Service
 * To post to LinkedIn legally, use LinkedIn API with proper permissions
 */
const postToLinkedIn = async (product) => {
  console.log(`\n💼 LinkedIn posting: DISABLED (violates ToS)`);
  console.log('   Browser automation is against LinkedIn Terms of Service');
  console.log('   To post to LinkedIn, use the official LinkedIn API');
  return { success: false, reason: 'tos_violation_disabled' };
};

/**
 * Main execution - post to social media (ONLY OFFICIAL APIs)
 */
const runSocialMediaCampaign = async () => {
  console.log('\n🚀 SOCIAL MEDIA AUTO-POSTER STARTING...\n');
  console.log('✅ COMPLIANCE MODE: Using official APIs only\n');
  console.log('   ✅ Reddit: Official API');
  console.log('   ❌ Facebook: DISABLED (ToS violation)');
  console.log('   ❌ LinkedIn: DISABLED (ToS violation)\n');

  const products = await getProducts();
  const productsToPost = products.slice(0, 3); // Post 3 products per run

  console.log(`📦 Found ${products.length} products, posting ${productsToPost.length}...\n`);

  const results = {
    reddit: [],
    facebook: [],
    linkedin: [],
  };

  for (const product of productsToPost) {
    console.log(`\n📌 Processing: ${product.title}\n`);

    // ONLY post to Reddit using official API (compliant)
    if (isPlatformEnabled('reddit') && process.env.REDDIT_USERNAME) {
      const redditResults = await postToReddit(product);
      results.reddit.push(...redditResults);
    }

    // Facebook and LinkedIn are DISABLED (ToS violations)
    // These log warnings and return immediately
    const facebookResult = await postToFacebook(product);
    results.facebook.push(facebookResult);

    const linkedinResult = await postToLinkedIn(product);
    results.linkedin.push(linkedinResult);

    // Delay between products
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute delay
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SOCIAL MEDIA CAMPAIGN SUMMARY:\n');

  console.log(`✅ Reddit: ${results.reddit.filter(r => r.success).length}/${results.reddit.length} successful`);
  console.log(`❌ Facebook: DISABLED (platform ToS violation)`);
  console.log(`❌ LinkedIn: DISABLED (platform ToS violation)`);

  console.log('\n' + '='.repeat(80));

  return results;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSocialMediaCampaign()
    .then(() => {
      console.log('\n✅ Social media campaign complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Campaign failed:', error);
      process.exit(1);
    });
}

export { runSocialMediaCampaign, postToReddit, postToFacebook, postToLinkedIn };
