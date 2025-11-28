/**
 * FREE TRAFFIC MASTER
 * Unified automation for posting across ALL social platforms
 * Uses OFFICIAL APIs (legal, no scraping, no browser automation)
 * 100% FREE traffic - zero ad spend required
 */

import { getProducts } from '../lib/database.js';
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// =====================
// TWITTER/X POSTING
// =====================
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const rwClient = twitterClient.readWrite;

const postToTwitter = async (product) => {
  console.log(`\n🐦 Twitter: ${product.title}`);

  try {
    // Simple, direct tweet - no AI needed
    const baseURL = 'https://modernbusinessmum.com';
    const productURL = `${baseURL}/shop#${product.id}`;

    const tweetText = `${product.title}

${product.description.substring(0, 150)}...

Perfect for ${product.niche} professionals.

Get it: ${productURL}`;

    const tweet = await rwClient.v2.tweet(tweetText);

    console.log(`   ✅ Posted! Tweet ID: ${tweet.data.id}`);
    return { success: true, tweetId: tweet.data.id };

  } catch (error) {
    console.error(`   ❌ Twitter error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// =====================
// PINTEREST POSTING
// =====================
const postToPinterest = async (product) => {
  console.log(`\n📌 Pinterest: ${product.title}`);

  try {
    const baseURL = 'https://modernbusinessmum.com';
    const productURL = `${baseURL}/shop#${product.id}`;

    const pinData = {
      board_id: process.env.PINTEREST_BOARD_ID,
      title: product.title,
      description: product.description,
      link: productURL,
      // Note: Pinterest requires an image URL
      // Using a placeholder for now - should generate product images
      media_source: {
        source_type: 'image_url',
        url: 'https://placehold.co/600x400/667eea/white?text=Notion+Template'
      }
    };

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinterest API error: ${error}`);
    }

    const result = await response.json();
    console.log(`   ✅ Pinned! Pin ID: ${result.id}`);
    return { success: true, pinId: result.id };

  } catch (error) {
    console.error(`   ❌ Pinterest error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// =====================
// FACEBOOK POSTING
// =====================
const postToFacebook = async (product) => {
  console.log(`\n📘 Facebook: ${product.title}`);

  try {
    const baseURL = 'https://modernbusinessmum.com';
    const productURL = `${baseURL}/shop#${product.id}`;

    const postText = `🎯 ${product.title}

${product.description}

Perfect for ${product.niche} professionals looking to level up their productivity.

Get it here: ${productURL}`;

    const response = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: postText,
        link: productURL,
        access_token: process.env.FACEBOOK_ACCESS_TOKEN,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Facebook API error: ${error}`);
    }

    const result = await response.json();
    console.log(`   ✅ Posted! Post ID: ${result.id}`);
    return { success: true, postId: result.id };

  } catch (error) {
    console.error(`   ❌ Facebook error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// =====================
// BLOG POST CREATION (SEO)
// =====================
const createBlogPost = async (product) => {
  console.log(`\n📝 SEO Blog: ${product.title}`);

  try {
    const slug = product.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.title} | Modern Business Mum</title>
    <meta name="description" content="${product.description}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            color: #2d3748;
            background: #f7fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: white;
            min-height: 100vh;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            color: #1a202c;
        }
        p {
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
        }
        .cta {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin: 3rem 0;
        }
        .cta a {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${product.title}</h1>
        <p>${product.description}</p>

        <div class="cta">
            <h3>Get This Template</h3>
            <a href="https://modernbusinessmum.com/shop#${product.id}">View Template →</a>
        </div>
    </div>
</body>
</html>`;

    const blogDir = path.join(__dirname, '..', 'public', 'blog');
    await fs.mkdir(blogDir, { recursive: true });

    const filePath = path.join(blogDir, `${slug}.html`);
    await fs.writeFile(filePath, html);

    console.log(`   ✅ Published to /blog/${slug}.html`);
    return { success: true, url: `/blog/${slug}.html` };

  } catch (error) {
    console.error(`   ❌ Blog error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// =====================
// MASTER AUTOMATION RUNNER
// =====================
const runFreeTrafficMaster = async (productsToPost = 3) => {
  console.log('\n🚀 FREE TRAFFIC MASTER - ALL PLATFORMS\n');
  console.log('Strategy: Maximum reach, zero ad spend, 100% automated\n');
  console.log('='.repeat(80));

  // Get top products
  const products = await getProducts({ status: 'listed', limit: productsToPost });

  console.log(`\n📦 Posting ${products.length} products across all platforms\n`);

  const results = {
    twitter: { successful: 0, failed: 0 },
    pinterest: { successful: 0, failed: 0 },
    facebook: { successful: 0, failed: 0 },
    blog: { successful: 0, failed: 0 },
  };

  for (const product of products) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n📢 POSTING: ${product.title}\n`);

    // Post to all platforms in parallel
    const [twitterResult, pinterestResult, facebookResult, blogResult] = await Promise.allSettled([
      postToTwitter(product),
      postToPinterest(product),
      postToFacebook(product),
      createBlogPost(product),
    ]);

    // Track results
    if (twitterResult.status === 'fulfilled' && twitterResult.value.success) {
      results.twitter.successful++;
    } else {
      results.twitter.failed++;
    }

    if (pinterestResult.status === 'fulfilled' && pinterestResult.value.success) {
      results.pinterest.successful++;
    } else {
      results.pinterest.failed++;
    }

    if (facebookResult.status === 'fulfilled' && facebookResult.value.success) {
      results.facebook.successful++;
    } else {
      results.facebook.failed++;
    }

    if (blogResult.status === 'fulfilled' && blogResult.value.success) {
      results.blog.successful++;
    } else {
      results.blog.failed++;
    }

    // Rate limiting - 10 seconds between products
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 FREE TRAFFIC CAMPAIGN SUMMARY\n');
  console.log(`🐦 Twitter:   ✅ ${results.twitter.successful} | ❌ ${results.twitter.failed}`);
  console.log(`📌 Pinterest: ✅ ${results.pinterest.successful} | ❌ ${results.pinterest.failed}`);
  console.log(`📘 Facebook:  ✅ ${results.facebook.successful} | ❌ ${results.facebook.failed}`);
  console.log(`📝 Blog/SEO:  ✅ ${results.blog.successful} | ❌ ${results.blog.failed}`);

  const totalSuccessful =
    results.twitter.successful +
    results.pinterest.successful +
    results.facebook.successful +
    results.blog.successful;

  const totalFailed =
    results.twitter.failed +
    results.pinterest.failed +
    results.facebook.failed +
    results.blog.failed;

  console.log('\n' + '-'.repeat(80));
  console.log(`📈 TOTAL: ✅ ${totalSuccessful} posts | ❌ ${totalFailed} failed`);
  console.log('\n💰 Expected Impact:');
  console.log(`   - Twitter reach: ${results.twitter.successful * 100} potential views`);
  console.log(`   - Pinterest reach: ${results.pinterest.successful * 200} potential views`);
  console.log(`   - Facebook reach: ${results.facebook.successful * 50} potential views`);
  console.log(`   - SEO blog posts: ${results.blog.successful} pages for Google indexing`);
  console.log('\n⏱️  Run this daily for consistent FREE traffic growth');
  console.log('🎯 First sale expected: 7-14 days');
  console.log('\n' + '='.repeat(80));

  return results;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const productsCount = parseInt(process.argv[2]) || 3;

  runFreeTrafficMaster(productsCount)
    .then(() => {
      console.log('\n✅ Free Traffic Master complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Campaign failed:', error);
      process.exit(1);
    });
}

export { runFreeTrafficMaster, postToTwitter, postToPinterest, postToFacebook, createBlogPost };
