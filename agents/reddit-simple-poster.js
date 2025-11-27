/**
 * SIMPLE REDDIT POSTER
 * Posts directly without API - just username/password
 */

import puppeteer from 'puppeteer';
import { getProducts, createListing } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const generateRedditPost = async (product) => {
  const prompt = `Create a Reddit post for this Notion template.

Product: ${product.title}
Description: ${product.description}
Price: $${product.suggested_price}

Requirements:
1. Title: Helpful, specific, NOT salesy (max 300 chars)
2. Body: Tell a story, be authentic, focus on the problem it solves
3. NO "buy my product" language
4. End with soft mention of link
5. Natural Reddit tone

Format as JSON:
{"title": "...", "content": "..."}`;

  return await generateText(prompt, 'json');
};

const postToRedditDirect = async (subreddit, title, content, link) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Go to Reddit
    await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2' });

    // Login
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.type('input[name="username"]', process.env.REDDIT_USERNAME);
    await page.type('input[name="password"]', process.env.REDDIT_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Go to subreddit
    await page.goto(`https://www.reddit.com/r/${subreddit}/submit`, { waitUntil: 'networkidle2' });

    // Wait a bit for page to load
    await page.waitForTimeout(3000);

    // Click "Post" tab (not Link)
    const postTab = await page.$('button[data-name="post"]');
    if (postTab) await postTab.click();
    await page.waitForTimeout(1000);

    // Fill in title
    await page.type('textarea[name="title"]', title);
    await page.waitForTimeout(500);

    // Fill in content
    const bodyText = `${content}\n\n[Get it here](${link})`;
    await page.type('div[contenteditable="true"]', bodyText);
    await page.waitForTimeout(1000);

    // Submit
    await page.click('button:has-text("Post")');
    await page.waitForTimeout(5000);

    const url = page.url();

    await browser.close();

    return { success: true, url };

  } catch (error) {
    await browser.close();
    return { success: false, error: error.message };
  }
};

export const runSimpleRedditPoster = async () => {
  console.log('\n🚀 SIMPLE REDDIT POSTER STARTING...\n');

  const products = await getProducts();
  const product = products[0]; // Post first product

  console.log(`📦 Posting: ${product.title}\n`);

  // Generate post
  const post = await generateRedditPost(product);

  // Get buy link
  const { data: listing } = await supabase
    .from('listings')
    .select('url')
    .eq('product_id', product.id)
    .eq('platform', 'stripe')
    .single();

  const buyLink = listing?.url || 'https://modernbusinessmum.com';

  // Post to Reddit
  const result = await postToRedditDirect('Notion', post.title, post.content, buyLink);

  if (result.success) {
    console.log(`✅ Posted successfully: ${result.url}`);

    await createListing({
      product_id: product.id,
      platform: 'reddit',
      url: result.url,
      status: 'published'
    });
  } else {
    console.log(`❌ Failed: ${result.error}`);
  }

  return result;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleRedditPoster()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
