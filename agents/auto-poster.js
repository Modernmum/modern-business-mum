/**
 * AUTO-POSTING SYSTEM
 * Automatically posts to Facebook Groups, Reddit, LinkedIn
 *
 * Strategies:
 * - Post services offers to Notion groups
 * - Share templates with helpful context
 * - Answer questions with product mentions
 * - Build authority and trust
 */

import { generateText } from '../lib/ai.js';
import { getProducts, logAction } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate social media post for services
 */
export const generateServicePost = async (platform, context = {}) => {
  const prompt = `You are a social media expert creating an authentic post to promote custom Notion services.

Platform: ${platform}
Context: ${JSON.stringify(context)}

Create a post that:
1. Doesn't feel like spam or overly salesy
2. Leads with value and helpfulness
3. Mentions the service naturally
4. Includes a clear but soft CTA
5. Feels genuine and personal
6. Matches the platform's tone (Reddit = casual, LinkedIn = professional, Facebook = friendly)

${platform === 'reddit' ? 'Include a title and body text' : 'Just body text'}

Return JSON:
{
  ${platform === 'reddit' ? '"title": "Engaging title",' : ''}
  "content": "Post content",
  "hashtags": ["hashtag1", "hashtag2"],
  "call_to_action": "Subtle CTA"
}`;

  const post = await generateText(prompt, 'json');
  return post;
};

/**
 * Generate template showcase post
 */
const generateTemplateShowcasePost = async (product, platform) => {
  const prompt = `You are sharing a genuinely helpful Notion template on ${platform}.

Template: ${product.title}
Description: ${product.description}
Features: ${product.features.slice(0, 3).join(', ')}
Price: $${product.suggested_price}

Create a post that:
1. Focuses on the PROBLEM it solves
2. Shows the VALUE, not just features
3. Is helpful first, promotional second
4. Includes social proof or use case
5. Has a natural CTA

Return JSON:
{
  ${platform === 'reddit' ? '"title": "Problem-focused title",' : ''}
  "content": "Helpful post content",
  "hashtags": ["relevant", "hashtags"],
  "product_link": "https://modernbusinessmum.com"
}`;

  const post = await generateText(prompt, 'json');
  return post;
};

/**
 * Generate helpful answer with product mention
 */
const generateHelpfulAnswer = async (question, relatedProducts) => {
  const prompt = `Someone asked: "${question}"

You have these relevant templates:
${relatedProducts.map(p => `- ${p.title}: ${p.description.substring(0, 100)}`).join('\n')}

Write a genuinely helpful answer that:
1. Actually solves their problem with actionable advice
2. Mentions your template as ONE option (not the only solution)
3. Doesn't feel pushy or salesy
4. Provides value even if they don't buy
5. Builds trust and authority

Return JSON:
{
  "answer": "Helpful, detailed answer",
  "template_mention": "Natural way to mention your template",
  "additional_tips": ["Bonus tip 1", "Bonus tip 2"]
}`;

  const answer = await generateText(prompt, 'json');
  return answer;
};

/**
 * Facebook Groups Auto-Poster
 * Note: Requires Facebook Graph API and manual setup
 */
export const postToFacebookGroups = async (groupIds, postContent) => {
  console.log('\n📘 POSTING TO FACEBOOK GROUPS\n');

  // Facebook Graph API requires:
  // 1. App with user_posts permission
  // 2. User access token with groups_access_member_info
  // 3. Group ID

  const instructions = `
MANUAL POSTING REQUIRED FOR FACEBOOK:

Facebook's API has strict limitations on group posting.
You need to post manually or use automation tools like:
- Zapier
- IFTTT
- Buffer
- Hootsuite

POST THIS:
${postContent.content}

TARGET GROUPS:
1. Notion Made Simple
2. Notion Templates & Productivity
3. Notion Users Community
4. Notion Productivity & Workflows
5. Notion for Entrepreneurs

POSTING SCHEDULE:
- 1 group per day (avoid spam detection)
- Post at peak hours (9am, 12pm, 6pm)
- Mix helpful content with service offers (80/20 rule)
`;

  console.log(instructions);

  await logAction('auto-poster', 'facebook_instructions_generated', 'success', {
    groups_count: groupIds?.length || 5,
  });

  return {
    platform: 'facebook',
    status: 'manual_required',
    instructions,
  };
};

/**
 * Reddit Auto-Poster
 * Uses Reddit API
 */
export const postToReddit = async (subreddit, postData) => {
  console.log(`\n🔴 POSTING TO r/${subreddit}\n`);

  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.log('⚠️  Reddit API not configured');
    console.log('\nAdd to .env:');
    console.log('REDDIT_CLIENT_ID=your_client_id');
    console.log('REDDIT_CLIENT_SECRET=your_client_secret');
    console.log('REDDIT_USERNAME=your_username');
    console.log('REDDIT_PASSWORD=your_password');
    console.log('\nGet credentials: https://www.reddit.com/prefs/apps\n');

    return {
      platform: 'reddit',
      status: 'not_configured',
      manual_post: {
        subreddit,
        title: postData.title,
        content: postData.content,
        url: `https://reddit.com/r/${subreddit}/submit`,
      },
    };
  }

  try {
    // Get Reddit access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=password&username=${process.env.REDDIT_USERNAME}&password=${process.env.REDDIT_PASSWORD}`,
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token) {
      throw new Error('Reddit authentication failed');
    }

    // Submit post
    const postResponse = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ModernBusinessBot/1.0',
      },
      body: new URLSearchParams({
        kind: 'self',
        sr: subreddit,
        title: postData.title,
        text: postData.content,
        resubmit: 'true',
      }),
    });

    const postResult = await postResponse.json();

    if (postResult.success) {
      console.log(`✅ Posted to r/${subreddit}`);
      console.log(`   ${postResult.json.data.url}\n`);

      await logAction('auto-poster', 'reddit_post_success', 'success', {
        subreddit,
        post_url: postResult.json.data.url,
      });

      return {
        platform: 'reddit',
        status: 'success',
        url: postResult.json.data.url,
      };
    } else {
      throw new Error(JSON.stringify(postResult));
    }

  } catch (error) {
    console.error(`❌ Failed to post to Reddit:`, error.message);

    await logAction('auto-poster', 'reddit_post_failed', 'error', {
      subreddit,
      error: error.message,
    });

    return {
      platform: 'reddit',
      status: 'failed',
      error: error.message,
    };
  }
};

/**
 * LinkedIn Auto-Poster
 */
export const postToLinkedIn = async (postContent) => {
  console.log('\n💼 POSTING TO LINKEDIN\n');

  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.log('⚠️  LinkedIn API not configured');
    console.log('\nLinkedIn requires OAuth 2.0 setup.');
    console.log('For now, post manually or use:\n');
    console.log('MANUAL POST:');
    console.log(postContent.content);
    console.log(`\nHashtags: ${postContent.hashtags.join(' ')}\n`);

    return {
      platform: 'linkedin',
      status: 'manual_required',
      content: postContent.content,
      hashtags: postContent.hashtags,
    };
  }

  // LinkedIn posting logic here (requires OAuth setup)
  // For now, provide manual instructions

  return {
    platform: 'linkedin',
    status: 'manual_required',
    content: postContent.content,
  };
};

/**
 * Master auto-posting campaign
 */
export const runAutoPostingCampaign = async (campaignType = 'services') => {
  console.log('\n🚀 AUTO-POSTING CAMPAIGN STARTING\n');

  try {
    const results = [];

    if (campaignType === 'services') {
      // Generate service posts for each platform
      const redditPost = await generateServicePost('reddit', {
        focus: 'custom templates',
        urgency: 'limited spots',
      });

      const facebookPost = await generateServicePost('facebook', {
        focus: 'notion setup service',
      });

      const linkedInPost = await generateServicePost('linkedin', {
        focus: 'professional services',
      });

      // Post to Reddit
      const redditResult = await postToReddit('Notion', redditPost);
      results.push(redditResult);

      // Post to Facebook (manual)
      const facebookResult = await postToFacebookGroups(null, facebookPost);
      results.push(facebookResult);

      // Post to LinkedIn (manual)
      const linkedInResult = await postToLinkedIn(linkedInPost);
      results.push(linkedInResult);

    } else if (campaignType === 'templates') {
      // Showcase random products
      const products = await getProducts({ status: 'listed' });
      const randomProduct = products[Math.floor(Math.random() * products.length)];

      const redditPost = await generateTemplateShowcasePost(randomProduct, 'reddit');
      const redditResult = await postToReddit('Notion', redditPost);
      results.push(redditResult);
    }

    console.log('\n📊 CAMPAIGN SUMMARY:');
    results.forEach(result => {
      console.log(`   ${result.platform}: ${result.status}`);
    });
    console.log('\n');

    await logAction('auto-poster', 'campaign_completed', 'success', {
      campaign_type: campaignType,
      results_count: results.length,
    });

    return {
      success: true,
      results,
    };

  } catch (error) {
    console.error('❌ Auto-posting campaign failed:', error);
    await logAction('auto-poster', 'campaign_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Schedule regular posting
 */
export const schedulePostingCampaigns = () => {
  // Post services every 2 days to Reddit
  setInterval(async () => {
    await runAutoPostingCampaign('services');
  }, 2 * 24 * 60 * 60 * 1000);

  // Post template showcases daily
  setInterval(async () => {
    await runAutoPostingCampaign('templates');
  }, 24 * 60 * 60 * 1000);

  console.log('📅 Auto-posting schedule activated');
  console.log('   Services: Every 2 days');
  console.log('   Templates: Daily\n');
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const campaignType = process.argv[2] || 'services';
  runAutoPostingCampaign(campaignType)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default {
  runAutoPostingCampaign,
  postToReddit,
  postToFacebookGroups,
  postToLinkedIn,
  schedulePostingCampaigns,
};
