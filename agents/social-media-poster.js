/**
 * SOCIAL MEDIA AUTO-POSTER AGENT
 * Posts to Reddit, Facebook, and LinkedIn using browser automation
 */

import { postToRedditWithBrowser, postToFacebookWithBrowser, postToLinkedInWithBrowser } from './puppeteer-poster.js';
import { getProducts, saveListingToDatabase } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
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
 * Post to Reddit
 */
const postToReddit = async (product) => {
  console.log(`\n📝 Creating Reddit post for: ${product.title}`);

  try {
    const postContent = await generatePlatformPost('reddit', product);

    // Get Stripe buy link from listings
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('product_id', product.id)
      .eq('platform', 'stripe')
      .single();

    const buyLink = listings?.url || '#';

    // Append buy link to content
    postContent.content += `\n\n[Learn more and get it here](${buyLink})`;

    // Post to relevant subreddits
    const subreddits = product.niche === 'business'
      ? ['Notion', 'productivity', 'Entrepreneur']
      : ['Notion', 'personalfinance', 'FinancialPlanning'];

    const results = [];

    for (const subreddit of subreddits) {
      console.log(`  Posting to r/${subreddit}...`);

      const result = await postToRedditWithBrowser(subreddit, postContent);

      if (result.success) {
        await saveListingToDatabase({
          product_id: product.id,
          platform: 'reddit',
          url: result.url || `https://reddit.com/r/${subreddit}`,
          status: 'published',
        });

        results.push({ subreddit, success: true, url: result.url });
      } else {
        results.push({ subreddit, success: false, error: result.error });
      }

      // Delay between posts to avoid spam detection
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
    }

    return results;

  } catch (error) {
    console.error(`  ❌ Error posting to Reddit:`, error.message);
    return [{ success: false, error: error.message }];
  }
};

/**
 * Post to Facebook
 */
const postToFacebook = async (product) => {
  console.log(`\n👥 Creating Facebook post for: ${product.title}`);

  if (!process.env.FACEBOOK_EMAIL || !process.env.FACEBOOK_PASSWORD) {
    console.log('  ⚠️  Facebook credentials not configured');
    return { success: false, reason: 'no_credentials' };
  }

  try {
    const postContent = await generatePlatformPost('facebook', product);

    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('product_id', product.id)
      .eq('platform', 'stripe')
      .single();

    const buyLink = listings?.url || '#';

    // Add link to post
    postContent.content += `\n\nLearn more: ${buyLink}`;

    const result = await postToFacebookWithBrowser(postContent);

    if (result.success) {
      await saveListingToDatabase({
        product_id: product.id,
        platform: 'facebook',
        url: result.url || '#',
        status: 'published',
      });
    }

    return result;

  } catch (error) {
    console.error(`  ❌ Error posting to Facebook:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Post to LinkedIn
 */
const postToLinkedIn = async (product) => {
  console.log(`\n💼 Creating LinkedIn post for: ${product.title}`);

  if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    console.log('  ⚠️  LinkedIn credentials not configured');
    return { success: false, reason: 'no_credentials' };
  }

  try {
    const postContent = await generatePlatformPost('linkedin', product);

    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('product_id', product.id)
      .eq('platform', 'stripe')
      .single();

    const buyLink = listings?.url || '#';

    // Add hashtags and link
    postContent.content += `\n\n🔗 ${buyLink}\n\n#Notion #Productivity #${product.niche === 'business' ? 'Business #Entrepreneurship' : 'Finance #PersonalFinance'}`;

    const result = await postToLinkedInWithBrowser(postContent);

    if (result.success) {
      await saveListingToDatabase({
        product_id: product.id,
        platform: 'linkedin',
        url: result.url || '#',
        status: 'published',
      });
    }

    return result;

  } catch (error) {
    console.error(`  ❌ Error posting to LinkedIn:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Main execution - post to all social media
 */
const runSocialMediaCampaign = async () => {
  console.log('\n🚀 SOCIAL MEDIA AUTO-POSTER STARTING...\n');

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

    // Post to each platform (sequential to avoid rate limits)
    if (process.env.REDDIT_USERNAME) {
      const redditResults = await postToReddit(product);
      results.reddit.push(...redditResults);
    }

    if (process.env.FACEBOOK_EMAIL) {
      const facebookResult = await postToFacebook(product);
      results.facebook.push(facebookResult);
    }

    if (process.env.LINKEDIN_EMAIL) {
      const linkedinResult = await postToLinkedIn(product);
      results.linkedin.push(linkedinResult);
    }

    // Delay between products
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute delay
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SOCIAL MEDIA CAMPAIGN SUMMARY:\n');

  console.log(`Reddit: ${results.reddit.filter(r => r.success).length}/${results.reddit.length} successful`);
  console.log(`Facebook: ${results.facebook.filter(r => r.success).length}/${results.facebook.length} successful`);
  console.log(`LinkedIn: ${results.linkedin.filter(r => r.success).length}/${results.linkedin.length} successful`);

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
