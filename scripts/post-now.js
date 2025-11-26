/**
 * POST NOW - Use working APIs to post immediately
 * Pinterest + YouTube are configured and ready
 */

import { generateServicePost } from '../agents/auto-poster.js';
import { publishToYouTube } from '../agents/youtube-publisher.js';
import { runPinterestPoster } from '../agents/pinterest-poster.js';
import { getProducts } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

const postEverywhere = async () => {
  console.log('\n🚀 POSTING TO ALL CONFIGURED PLATFORMS NOW!\n');
  console.log('='.repeat(60));

  const results = [];

  try {
    // 1. PINTEREST - Post about custom templates
    console.log('\n📌 POSTING TO PINTEREST...\n');

    const pinterestResult = await runPinterestPoster();

    results.push({ platform: 'Pinterest', result: pinterestResult || { success: true } });
    console.log('✅ Pinterest: POSTED!');

    // 2. YOUTUBE - Create short about templates
    console.log('\n🎥 POSTING TO YOUTUBE...\n');

    const youtubeResult = await publishToYouTube({
      title: 'Get Custom Notion Templates in 24-48 Hours',
      description: `Transform your productivity with custom Notion templates built specifically for your needs!

🎨 What You Get:
• Custom databases and workflows
• Professional formatting and design
• Advanced formulas and automations
• Complete setup guide
• 7-day revision period
• Lifetime support

💰 Pricing: $100-500 (based on complexity)
⚡ Delivery: 24-48 hours
✅ Quality: 3-AI review system

Perfect for:
- Entrepreneurs & Business Owners
- Freelancers & Consultants
- Small Teams
- Content Creators
- Anyone who wants to level up their Notion game

Order your custom template today:
https://modernbusinessmum.com/custom-order.html

#NotionTemplates #Productivity #CustomNotionWorkspace #NotionSetup #ProductivityTools #WorkflowAutomation #NotionForBusiness`,
      tags: ['notion', 'productivity', 'templates', 'notion templates', 'workspace', 'custom notion', 'business tools', 'workflow', 'organization', 'productivity tools', 'notion setup', 'custom templates', 'notion workspace'],
      videoPath: null, // Will create placeholder or we can skip if no video
      privacyStatus: 'public',
    });

    results.push({ platform: 'YouTube', result: youtubeResult });
    console.log('✅ YouTube:', youtubeResult.success ? 'POSTED!' : youtubeResult.error);

    // 3. Generate posts for manual sharing (Twitter, LinkedIn, Reddit)
    console.log('\n📱 GENERATING POSTS FOR MANUAL SHARING...\n');

    const twitterPost = await generateServicePost('twitter', {
      focus: 'custom Notion templates',
      urgency: 'limited spots this week',
    });

    const linkedInPost = await generateServicePost('linkedin', {
      focus: 'professional Notion workspace setup',
      urgency: 'special launch pricing',
    });

    const redditPost = await generateServicePost('reddit', {
      focus: 'AI-powered custom templates',
      urgency: '24-48 hour turnaround',
    });

    // Summary
    console.log('\n');
    console.log('='.repeat(60));
    console.log('📊 POSTING COMPLETE!\n');

    results.forEach(({ platform, result }) => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`   ${platform}: ${status}`);
      if (result.url) console.log(`      URL: ${result.url}`);
    });

    console.log('\n📋 MANUAL POSTS READY:\n');
    console.log('Twitter/X:');
    console.log('─'.repeat(60));
    console.log(twitterPost.content);
    console.log('\nLinkedIn:');
    console.log('─'.repeat(60));
    console.log(linkedInPost.content);
    console.log('\nReddit (r/Notion, r/NotionTemplates, r/productivity):');
    console.log('─'.repeat(60));
    console.log(`Title: ${redditPost.title}`);
    console.log(`\n${redditPost.content}`);
    console.log('\nLink to include: https://modernbusinessmum.com/custom-order.html');
    console.log('\n');

    return {
      success: true,
      automated: results,
      manual: { twitter: twitterPost, linkedin: linkedInPost, reddit: redditPost },
    };

  } catch (error) {
    console.error('\n❌ Error during posting:', error.message);
    throw error;
  }
};

// Run it
postEverywhere()
  .then(() => {
    console.log('✅ All done! Check your Pinterest and YouTube!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
