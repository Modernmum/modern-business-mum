/**
 * PUPPETEER BROWSER AUTOMATION BOT
 * True automation for social media posting - NO manual work
 *
 * Bypasses API restrictions by controlling actual browsers
 * Handles logins, captchas, and posting workflows automatically
 *
 * PLATFORMS:
 * - Reddit: r/Notion, r/NotionTemplates, r/productivity
 * - Facebook: Notion groups
 * - LinkedIn: Personal profile posts
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logAction } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reddit Auto-Poster with Browser Automation
 */
export const postToRedditWithBrowser = async (subreddit, postData) => {
  console.log(`\n🤖 BROWSER BOT: Posting to r/${subreddit}\n`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // TEMPORARILY visible for debugging - change to 'new' for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Go to Reddit login
    console.log('⏳ Navigating to Reddit...');
    await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2' });
    await delay(3000); // Wait for page to fully load

    // Login - try multiple selectors
    console.log('🔐 Logging in...');

    // Wait for any input fields to appear
    await page.waitForSelector('input', { timeout: 10000 });

    // Try to find username field with comprehensive selectors
    const usernameSelectors = [
      '#loginUsername',
      'input[name="username"]',
      'input[id*="username"]',
      'input[id*="Username"]',
      'input[placeholder*="Username"]',
      'input[placeholder*="username"]',
      'input[autocomplete="username"]',
      'input[type="text"]'
    ];

    let usernameField = null;
    for (const selector of usernameSelectors) {
      const fields = await page.$$(selector);
      if (fields.length > 0) {
        usernameField = fields[0];
        console.log(`   Found username field: ${selector}`);
        break;
      }
    }

    if (!usernameField) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'reddit-login-debug.png' });
      throw new Error('Could not find username input field - screenshot saved as reddit-login-debug.png');
    }

    await usernameField.click({ clickCount: 3 }); // Select any existing text
    await usernameField.type(process.env.REDDIT_USERNAME, { delay: 100 });
    await delay(1000);

    // Try to find password field
    const passwordSelectors = [
      '#loginPassword',
      'input[name="password"]',
      'input[id*="password"]',
      'input[id*="Password"]',
      'input[placeholder*="Password"]',
      'input[placeholder*="password"]',
      'input[autocomplete="current-password"]',
      'input[type="password"]'
    ];

    let passwordField = null;
    for (const selector of passwordSelectors) {
      const fields = await page.$$(selector);
      if (fields.length > 0) {
        passwordField = fields[0];
        console.log(`   Found password field: ${selector}`);
        break;
      }
    }

    if (!passwordField) {
      await page.screenshot({ path: 'reddit-login-debug.png' });
      throw new Error('Could not find password input field - screenshot saved as reddit-login-debug.png');
    }

    await passwordField.click({ clickCount: 3 });
    await passwordField.type(process.env.REDDIT_PASSWORD, { delay: 100 });
    await delay(1000);

    // Click login button - try multiple approaches
    let submitButton = null;
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Log In")',
      'button:has-text("Log in")',
      'button:has-text("LOGIN")',
      'button[class*="login"]',
      'button[class*="submit"]'
    ];

    for (const selector of submitSelectors) {
      const buttons = await page.$$(selector);
      if (buttons.length > 0) {
        submitButton = buttons[0];
        console.log(`   Found submit button: ${selector}`);
        break;
      }
    }

    if (!submitButton) {
      // Try alternative: press Enter key
      console.log('   Trying Enter key instead...');
      await page.keyboard.press('Enter');
    } else {
      await submitButton.click();
    }

    // Wait for login to complete
    console.log('   Waiting for login...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    } catch (navError) {
      // Check if we're already logged in by looking for user menu
      const userMenu = await page.$('[data-testid="user-menu-button"]') || await page.$('[id*="USER_DROPDOWN"]');
      if (!userMenu) {
        throw new Error('Login failed - navigation timeout');
      }
    }
    console.log('✅ Logged in successfully');

    // Navigate to submit page for specific subreddit
    console.log(`📝 Navigating to r/${subreddit} submit page...`);
    await page.goto(`https://www.reddit.com/r/${subreddit}/submit`, { waitUntil: 'networkidle2' });

    // Wait a bit to avoid detection
    await delay(2000);

    // Click on "Post" tab if not already selected
    const postTab = await page.$('button[data-name="text_post_button"]');
    if (postTab) {
      await postTab.click();
      await delay(1000);
    }

    // Fill in title
    console.log('✍️  Writing post...');
    const titleInput = await page.$('textarea[placeholder*="Title"]');
    if (titleInput) {
      await titleInput.type(postData.title, { delay: 50 }); // Type like a human
    }

    // Fill in body text
    const bodyInput = await page.$('div[contenteditable="true"]');
    if (bodyInput) {
      await bodyInput.click();
      await delay(500);
      await bodyInput.type(postData.content, { delay: 30 });
    }

    // Wait before submitting
    await delay(2000);

    // Click submit button
    console.log('🚀 Submitting post...');
    const postSubmitButton = await page.$('button:has-text("Post")') || await page.$('button[type="submit"]');
    if (postSubmitButton) {
      await postSubmitButton.click();
    }

    // Wait for post to be created
    await delay(5000);

    // Get the URL of the new post
    const postUrl = page.url();

    console.log(`✅ Posted to r/${subreddit}`);
    console.log(`   ${postUrl}\n`);

    await logAction('puppeteer-poster', 'reddit_post_success', 'success', {
      subreddit,
      post_url: postUrl,
      title: postData.title,
    });

    await browser.close();

    return {
      success: true,
      platform: 'reddit',
      url: postUrl,
      subreddit,
    };

  } catch (error) {
    console.error(`❌ Reddit posting failed:`, error.message);

    await logAction('puppeteer-poster', 'reddit_post_failed', 'error', {
      subreddit,
      error: error.message,
    });

    if (browser) await browser.close();

    return {
      success: false,
      platform: 'reddit',
      error: error.message,
    };
  }
};

/**
 * Facebook Groups Auto-Poster with Browser Automation
 */
export const postToFacebookWithBrowser = async (groupUrls, postData) => {
  console.log(`\n🤖 BROWSER BOT: Posting to ${groupUrls.length} Facebook groups\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Login to Facebook
    console.log('⏳ Navigating to Facebook...');
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });

    console.log('🔐 Logging in...');
    await page.type('#email', process.env.FACEBOOK_EMAIL);
    await page.type('#pass', process.env.FACEBOOK_PASSWORD);
    await page.click('button[name="login"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Logged in successfully');

    const results = [];

    // Post to each group
    for (const groupUrl of groupUrls) {
      try {
        console.log(`📝 Posting to group: ${groupUrl}`);

        await page.goto(groupUrl, { waitUntil: 'networkidle2' });
        await delay(3000);

        // Click on "Write something" or post creation area
        const postButton = await page.$('div[role="button"][aria-label*="Write"]') ||
                          await page.$('span:has-text("Write something")');

        if (postButton) {
          await postButton.click();
          await delay(2000);

          // Type the post content
          const textArea = await page.$('div[contenteditable="true"][role="textbox"]');
          if (textArea) {
            await textArea.type(postData.content, { delay: 40 });
            await delay(2000);

            // Click Post button
            const submitButton = await page.$('div[aria-label="Post"]') ||
                                await page.$('span:has-text("Post")');
            if (submitButton) {
              await submitButton.click();
              await delay(5000);

              console.log(`✅ Posted to ${groupUrl}`);
              results.push({ success: true, group: groupUrl });
            }
          }
        }

        // Wait between posts to avoid spam detection
        await delay(10000);

      } catch (error) {
        console.error(`❌ Failed to post to ${groupUrl}:`, error.message);
        results.push({ success: false, group: groupUrl, error: error.message });
      }
    }

    await browser.close();

    await logAction('puppeteer-poster', 'facebook_posts_completed', 'success', {
      groups_count: groupUrls.length,
      successful: results.filter(r => r.success).length,
    });

    return {
      success: true,
      platform: 'facebook',
      results,
    };

  } catch (error) {
    console.error(`❌ Facebook posting failed:`, error.message);

    await logAction('puppeteer-poster', 'facebook_post_failed', 'error', {
      error: error.message,
    });

    if (browser) await browser.close();

    return {
      success: false,
      platform: 'facebook',
      error: error.message,
    };
  }
};

/**
 * LinkedIn Auto-Poster with Browser Automation
 */
export const postToLinkedInWithBrowser = async (postData) => {
  console.log(`\n🤖 BROWSER BOT: Posting to LinkedIn\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Login to LinkedIn
    console.log('⏳ Navigating to LinkedIn...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

    console.log('🔐 Logging in...');
    await page.type('#username', process.env.LINKEDIN_EMAIL);
    await page.type('#password', process.env.LINKEDIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Logged in successfully');

    // Navigate to feed
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Click "Start a post" button
    console.log('📝 Creating post...');
    const startPostButton = await page.$('button:has-text("Start a post")') ||
                           await page.$('.share-box-feed-entry__trigger');

    if (startPostButton) {
      await startPostButton.click();
      await delay(2000);

      // Type content
      const editor = await page.$('div[role="textbox"][contenteditable="true"]');
      if (editor) {
        await editor.type(postData.content, { delay: 40 });

        // Add hashtags if provided
        if (postData.hashtags && postData.hashtags.length > 0) {
          const hashtagText = '\n\n' + postData.hashtags.map(tag => `#${tag}`).join(' ');
          await editor.type(hashtagText, { delay: 40 });
        }

        await delay(2000);

        // Click Post button
        const postButton = await page.$('button:has-text("Post")') ||
                          await page.$('.share-actions__primary-action');

        if (postButton) {
          await postButton.click();
          await delay(5000);

          console.log(`✅ Posted to LinkedIn\n`);

          await logAction('puppeteer-poster', 'linkedin_post_success', 'success', {
            content_length: postData.content.length,
          });

          await browser.close();

          return {
            success: true,
            platform: 'linkedin',
          };
        }
      }
    }

    throw new Error('Failed to find post creation elements');

  } catch (error) {
    console.error(`❌ LinkedIn posting failed:`, error.message);

    await logAction('puppeteer-poster', 'linkedin_post_failed', 'error', {
      error: error.message,
    });

    if (browser) await browser.close();

    return {
      success: false,
      platform: 'linkedin',
      error: error.message,
    };
  }
};

/**
 * Run full automated posting campaign across all platforms
 */
export const runBrowserPostingCampaign = async (platforms = ['reddit', 'facebook', 'linkedin'], postContent) => {
  console.log('\n🚀 BROWSER BOT CAMPAIGN STARTING\n');
  console.log(`Platforms: ${platforms.join(', ')}\n`);

  const results = [];

  try {
    // Reddit
    if (platforms.includes('reddit')) {
      const subreddits = ['Notion', 'NotionTemplates', 'productivity'];

      for (const subreddit of subreddits) {
        const result = await postToRedditWithBrowser(subreddit, postContent.reddit || postContent);
        results.push(result);

        // Wait between subreddit posts to avoid spam detection
        await delay(60000); // 1 minute
      }
    }

    // Facebook
    if (platforms.includes('facebook')) {
      const groups = [
        'https://www.facebook.com/groups/notionmadememes', // Example - replace with real groups
        // Add more group URLs
      ];

      const result = await postToFacebookWithBrowser(groups, postContent.facebook || postContent);
      results.push(result);
    }

    // LinkedIn
    if (platforms.includes('linkedin')) {
      const result = await postToLinkedInWithBrowser(postContent.linkedin || postContent);
      results.push(result);
    }

    console.log('\n📊 CAMPAIGN SUMMARY:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.platform}: ${result.success ? 'SUCCESS' : result.error}`);
    });
    console.log('\n');

    await logAction('puppeteer-poster', 'campaign_completed', 'success', {
      platforms,
      total_posts: results.length,
      successful: results.filter(r => r.success).length,
    });

    return {
      success: true,
      results,
    };

  } catch (error) {
    console.error('❌ Campaign failed:', error);

    await logAction('puppeteer-poster', 'campaign_failed', 'error', {
      error: error.message,
    });

    throw error;
  }
};

/**
 * Schedule automated posting campaigns
 */
export const scheduleAutomatedPosting = (interval = 2 * 24 * 60 * 60 * 1000) => {
  console.log('🤖 AUTOMATED POSTING SCHEDULED');
  console.log(`   Interval: Every ${interval / (24 * 60 * 60 * 1000)} days\n`);

  // Import needed for generating posts
  const generatePosts = async () => {
    const { generateServicePost } = await import('./auto-poster.js');

    return {
      reddit: await generateServicePost('reddit', { focus: 'custom templates' }),
      facebook: await generateServicePost('facebook', { focus: 'notion setup' }),
      linkedin: await generateServicePost('linkedin', { focus: 'professional services' }),
    };
  };

  // Run immediately
  generatePosts().then(posts => runBrowserPostingCampaign(['reddit', 'facebook', 'linkedin'], posts));

  // Schedule recurring
  setInterval(async () => {
    const posts = await generatePosts();
    await runBrowserPostingCampaign(['reddit', 'facebook', 'linkedin'], posts);
  }, interval);
};

export default {
  postToRedditWithBrowser,
  postToFacebookWithBrowser,
  postToLinkedInWithBrowser,
  runBrowserPostingCampaign,
  scheduleAutomatedPosting,
};
