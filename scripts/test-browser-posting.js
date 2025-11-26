/**
 * TEST SCRIPT: Browser Automation Posting
 * Demonstrates the Puppeteer bot in action
 */

import { postToRedditWithBrowser, runBrowserPostingCampaign } from '../agents/puppeteer-poster.js';
import { generateServicePost } from '../agents/auto-poster.js';
import dotenv from 'dotenv';

dotenv.config();

const testBrowserPosting = async () => {
  console.log('\n🤖 TESTING BROWSER AUTOMATION BOT\n');
  console.log('='.repeat(50));

  // Check credentials
  console.log('\n📋 CHECKING CREDENTIALS:\n');

  const credentials = {
    reddit: process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD,
    facebook: process.env.FACEBOOK_EMAIL && process.env.FACEBOOK_PASSWORD,
    linkedin: process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASSWORD,
  };

  console.log(`Reddit: ${credentials.reddit ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Facebook: ${credentials.facebook ? '✅ Configured' : '❌ Missing'}`);
  console.log(`LinkedIn: ${credentials.linkedin ? '✅ Configured' : '❌ Missing'}`);

  if (!credentials.reddit && !credentials.facebook && !credentials.linkedin) {
    console.log('\n⚠️  NO CREDENTIALS CONFIGURED\n');
    console.log('Add your credentials to .env:');
    console.log('  REDDIT_USERNAME=your_username');
    console.log('  REDDIT_PASSWORD=your_password');
    console.log('  FACEBOOK_EMAIL=your_email');
    console.log('  FACEBOOK_PASSWORD=your_password');
    console.log('  LINKEDIN_EMAIL=your_email');
    console.log('  LINKEDIN_PASSWORD=your_password\n');
    return;
  }

  // Generate test post
  console.log('\n🎨 GENERATING TEST POST WITH AI:\n');
  const testPost = await generateServicePost('reddit', {
    focus: 'custom Notion templates',
    urgency: 'limited availability',
  });

  console.log('Title:', testPost.title);
  console.log('Content Preview:', testPost.content.substring(0, 150) + '...');
  console.log('\n');

  // Ask which platform to test
  console.log('📊 AVAILABLE TESTS:\n');
  console.log('1. Test Reddit posting (r/test subreddit)');
  console.log('2. Test Facebook posting');
  console.log('3. Test LinkedIn posting');
  console.log('4. Run full campaign (all platforms)\n');

  const testType = process.argv[2] || 'reddit';

  switch (testType) {
    case 'reddit':
    case '1':
      if (credentials.reddit) {
        console.log('🧪 Testing Reddit posting to r/test...\n');
        const result = await postToRedditWithBrowser('test', testPost);
        console.log('\nResult:', result);
      } else {
        console.log('❌ Reddit credentials not configured\n');
      }
      break;

    case 'facebook':
    case '2':
      console.log('❌ Facebook test not implemented yet (need real group URLs)\n');
      console.log('Update test-browser-posting.js with your group URLs first.\n');
      break;

    case 'linkedin':
    case '3':
      if (credentials.linkedin) {
        console.log('🧪 Testing LinkedIn posting...\n');
        const { postToLinkedInWithBrowser } = await import('../agents/puppeteer-poster.js');
        const result = await postToLinkedInWithBrowser(testPost);
        console.log('\nResult:', result);
      } else {
        console.log('❌ LinkedIn credentials not configured\n');
      }
      break;

    case 'campaign':
    case '4':
      console.log('🧪 Testing full campaign...\n');

      const posts = {
        reddit: await generateServicePost('reddit', { focus: 'custom templates' }),
        facebook: await generateServicePost('facebook', { focus: 'notion setup' }),
        linkedin: await generateServicePost('linkedin', { focus: 'professional services' }),
      };

      const platforms = [];
      if (credentials.reddit) platforms.push('reddit');
      if (credentials.facebook) platforms.push('facebook');
      if (credentials.linkedin) platforms.push('linkedin');

      const campaignResult = await runBrowserPostingCampaign(platforms, posts);
      console.log('\nCampaign Result:', campaignResult);
      break;

    default:
      console.log('Invalid test type. Use: reddit, facebook, linkedin, or campaign\n');
  }

  console.log('\n✅ TEST COMPLETE\n');
};

// Run test
testBrowserPosting()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
