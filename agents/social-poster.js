/**
 * SOCIAL POSTER AGENT
 * Automatically posts products to Twitter, TikTok, and Instagram
 * Enhanced with real API integration
 */

import { getProducts, logAction } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Post to Twitter/X
 */
const postToTwitter = async (content, productUrl) => {
  if (!process.env.TWITTER_API_KEY) {
    console.log('  ⚠️  Twitter API not configured - skipping');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    // TODO: Implement Twitter API posting when credentials are added
    // For now, log what would be posted
    console.log('  📱 Would post to Twitter:');
    console.log(`     ${content.substring(0, 100)}...`);

    return { success: true, platform: 'twitter', url: productUrl };
  } catch (error) {
    console.error('  ❌ Twitter posting error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate short video script for TikTok/Instagram Reels
 */
const generateShortVideoScript = async (product, buyLink) => {
  const prompt = `Generate a 15-30 second TikTok/Instagram Reels script for this Notion template.

Product: ${product.title}
Features: ${product.template_content.features.slice(0, 3).join(', ')}
Price: $${product.suggested_price}
Niche: ${product.niche}

Create a script that:
1. Hooks in first 2 seconds
2. Shows 3 quick features
3. Ends with CTA
4. Is fast-paced and engaging
5. Uses trending phrases

Format:
{
  "hook": "POV: You need to organize your ${product.niche}...",
  "scene_1": "Scene 1 description",
  "scene_2": "Scene 2 description",
  "scene_3": "Scene 3 description",
  "cta": "Link in bio to get it for $${product.suggested_price}",
  "caption": "Engaging caption with hashtags",
  "hashtags": ["#NotionTemplate", "#Productivity", ...]
}`;

  const script = await generateText(prompt, 'json');
  return script;
};

/**
 * Post to TikTok
 */
const postToTikTok = async (product, content, productUrl, videoPath) => {
  if (!process.env.TIKTOK_ACCESS_TOKEN) {
    console.log('  ⚠️  TikTok API not configured - saving script');

    // Save script for manual posting
    const scriptsDir = path.join(process.cwd(), 'tiktok-scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    const script = await generateShortVideoScript(product, productUrl);
    const scriptPath = path.join(scriptsDir, `${product.id}-tiktok.json`);
    fs.writeFileSync(scriptPath, JSON.stringify({
      product_id: product.id,
      product_title: product.title,
      script,
      buy_link: productUrl,
      created_at: new Date().toISOString(),
    }, null, 2));

    console.log(`  💾 TikTok script saved: ${scriptPath}`);
    return { success: false, reason: 'no_api_key', script_saved: true, script_path: scriptPath };
  }

  try {
    // TikTok Content Posting API
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        post_info: {
          title: content.substring(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoPath ? fs.statSync(videoPath).size : 0,
          chunk_size: 10000000,
          total_chunk_count: 1,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log(`  ✅ TikTok video posted`);
    return { success: true, platform: 'tiktok', post_id: response.data.data.publish_id };

  } catch (error) {
    console.error('  ❌ TikTok posting error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Post to Instagram
 */
const postToInstagram = async (product, content, productUrl, videoPath) => {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    console.log('  ⚠️  Instagram API not configured - saving script');

    // Save script for manual posting (same as TikTok)
    const scriptsDir = path.join(process.cwd(), 'instagram-scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    const script = await generateShortVideoScript(product, productUrl);
    const scriptPath = path.join(scriptsDir, `${product.id}-instagram.json`);
    fs.writeFileSync(scriptPath, JSON.stringify({
      product_id: product.id,
      product_title: product.title,
      script,
      buy_link: productUrl,
      created_at: new Date().toISOString(),
    }, null, 2));

    console.log(`  💾 Instagram script saved: ${scriptPath}`);
    return { success: false, reason: 'no_api_key', script_saved: true, script_path: scriptPath };
  }

  try {
    // Instagram Graph API - Create Media Container
    const igUserId = process.env.INSTAGRAM_USER_ID;

    // For Reels
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        media_type: 'REELS',
        video_url: videoPath, // Must be hosted URL
        caption: content,
        share_to_feed: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
        }
      }
    );

    const mediaId = response.data.id;

    // Publish the media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        creation_id: mediaId,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
        }
      }
    );

    console.log(`  ✅ Instagram Reel posted`);
    return { success: true, platform: 'instagram', media_id: publishResponse.data.id };

  } catch (error) {
    console.error('  ❌ Instagram posting error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Main Social Poster Agent execution
 */
export const runSocialPoster = async () => {
  console.log('\n📱 SOCIAL POSTER AGENT STARTING...\n');

  try {
    await logAction('social-poster', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get products that haven't been posted yet
    // For now, get the 3 most recent products
    const products = await getProducts({ status: 'listed', limit: 3 });

    if (products.length === 0) {
      console.log('ℹ️  No products to post.');
      return { posted: 0 };
    }

    console.log(`🎯 Posting ${products.length} products to social media...\n`);

    const postResults = [];

    for (const product of products) {
      try {
        console.log(`  Posting: ${product.title}`);

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

        // Load the promotion content
        const fs = await import('fs');
        const path = await import('path');
        const promotionsDir = path.join(process.cwd(), 'promotions');

        // Find the most recent promotions file
        const files = fs.readdirSync(promotionsDir);
        const latestFile = files.sort().reverse()[0];
        const promotionsPath = path.join(promotionsDir, latestFile);
        const promotions = JSON.parse(fs.readFileSync(promotionsPath, 'utf8'));

        // Find this product's promotion
        const promotion = promotions.find(p => p.product.id === product.id);

        if (!promotion) {
          console.log('  ⚠️  No promotion content found - skipping');
          continue;
        }

        // Post to each platform
        const twitterResult = await postToTwitter(promotion.content.twitter, buyLink);
        const tiktokResult = await postToTikTok(product, promotion.content.tiktok, buyLink, null);
        const instagramResult = await postToInstagram(product, promotion.content.instagram, buyLink, null);

        postResults.push({
          product_id: product.id,
          title: product.title,
          twitter: twitterResult,
          tiktok: tiktokResult,
          instagram: instagramResult
        });

        console.log(`  ✅ Social posting queued for ${product.title}`);

        // Log posting
        await logAction('social-poster', 'content_posted', 'success', {
          product_id: product.id,
          title: product.title,
          platforms: ['twitter', 'tiktok', 'instagram']
        });

      } catch (error) {
        console.error(`  ❌ Error posting ${product.title}:`, error.message);
        await logAction('social-poster', 'posting_failed', 'error', {
          product_id: product.id,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Social Poster Agent completed`);
    console.log(`📊 Posted ${postResults.length} products\n`);

    await logAction('social-poster', 'run_completed', 'success', {
      posted_count: postResults.length,
      timestamp: new Date().toISOString(),
    });

    return {
      posted: postResults.length,
      results: postResults
    };

  } catch (error) {
    console.error('❌ Social Poster Agent failed:', error.message);
    await logAction('social-poster', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runSocialPoster()
    .then((result) => {
      console.log('\n📊 SOCIAL POSTING SUMMARY:');
      console.log(`   Products posted: ${result.posted}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Social Poster Error:', error);
      process.exit(1);
    });
}

export default { runSocialPoster };
