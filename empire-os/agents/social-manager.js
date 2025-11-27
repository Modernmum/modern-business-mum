/**
 * SOCIAL MEDIA MANAGEMENT SERVICE
 * AI creates posts for clients, auto-schedules across platforms (Twitter, LinkedIn, Instagram, Facebook)
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate social media content calendar for client
const generateContentCalendar = async (client) => {
  const prompt = `Create a 7-day social media content calendar for this client:

Client: ${client.company_name}
Industry: ${client.industry}
Brand Voice: ${client.brand_voice || 'Professional, engaging, helpful'}
Target Audience: ${client.target_audience || 'Business professionals'}
Goals: ${client.social_goals || 'Increase engagement, build authority, drive traffic'}

Content mix:
- 40% educational/value posts
- 30% industry insights
- 20% engagement posts (questions, polls)
- 10% promotional

Generate 7 days of posts (1 per day):
- Monday: Educational tip
- Tuesday: Industry insight
- Wednesday: Engagement post
- Thursday: Case study/success story
- Friday: Weekend motivation
- Saturday: Behind-the-scenes
- Sunday: Thought leadership

For each post, provide:
- Content (optimized for each platform)
- Best posting time
- Hashtags (relevant, not spammy)
- Call to action

Format as JSON array:
[
  {
    "day": "Monday",
    "twitter": {"text": "...", "hashtags": ["...", "..."]},
    "linkedin": {"text": "...", "hashtags": ["...", "..."]},
    "instagram": {"caption": "...", "hashtags": ["...", "..."]},
    "facebook": {"text": "...", "hashtags": ["...", "..."]},
    "postTime": "09:00",
    "cta": "..."
  },
  ...
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Generate single post (for specific topic/event)
const generateSocialPost = async (client, topic, platform = 'all') => {
  const prompt = `Write a social media post for this client:

Client: ${client.company_name}
Industry: ${client.industry}
Brand Voice: ${client.brand_voice || 'Professional, engaging'}
Topic: ${topic}
Platform: ${platform}

Requirements:
- Engaging hook
- Valuable content
- Clear CTA
- Appropriate length for platform
- Relevant hashtags (3-5, not spammy)

${platform === 'twitter' || platform === 'all' ? 'Twitter: Max 280 chars, punchy' : ''}
${platform === 'linkedin' || platform === 'all' ? 'LinkedIn: 150-200 words, professional' : ''}
${platform === 'instagram' || platform === 'all' ? 'Instagram: Engaging caption, 125-150 words' : ''}
${platform === 'facebook' || platform === 'all' ? 'Facebook: 100-150 words, conversational' : ''}

Format as JSON:
{
  "twitter": {"text": "...", "hashtags": [...]},
  "linkedin": {"text": "...", "hashtags": [...]},
  "instagram": {"caption": "...", "hashtags": [...]},
  "facebook": {"text": "...", "hashtags": [...]}
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Generate image prompt for post (to use with DALL-E or similar)
const generateImagePrompt = async (postContent) => {
  const prompt = `Create an image generation prompt for this social media post:

Post content: ${postContent}

Generate a detailed DALL-E style prompt that:
- Matches the post topic
- Professional and on-brand
- Eye-catching but not cluttered
- Suitable for social media (square format)
- No text in image

Return just the image prompt as plain text.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text;
};

// Save posts to database for scheduling
const savePostsToSchedule = async (clientId, posts, startDate = new Date()) => {
  const scheduledPosts = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const postDate = new Date(startDate);
    postDate.setDate(postDate.getDate() + i); // One day apart

    // Set posting time
    const [hours, minutes] = (post.postTime || '09:00').split(':');
    postDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Save Twitter post
    if (post.twitter) {
      const { data: twitterPost } = await supabase
        .from('scheduled_posts')
        .insert([{
          client_id: clientId,
          platform: 'twitter',
          content: post.twitter.text,
          hashtags: post.twitter.hashtags,
          scheduled_time: postDate.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      scheduledPosts.push(twitterPost);
    }

    // Save LinkedIn post
    if (post.linkedin) {
      const linkedInDate = new Date(postDate);
      linkedInDate.setHours(linkedInDate.getHours() + 3); // 3 hours after Twitter

      const { data: linkedInPost } = await supabase
        .from('scheduled_posts')
        .insert([{
          client_id: clientId,
          platform: 'linkedin',
          content: post.linkedin.text,
          hashtags: post.linkedin.hashtags,
          scheduled_time: linkedInDate.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      scheduledPosts.push(linkedInPost);
    }

    // Save Instagram post
    if (post.instagram) {
      const instaDate = new Date(postDate);
      instaDate.setHours(instaDate.getHours() + 6); // 6 hours after Twitter

      const { data: instaPost } = await supabase
        .from('scheduled_posts')
        .insert([{
          client_id: clientId,
          platform: 'instagram',
          content: post.instagram.caption,
          hashtags: post.instagram.hashtags,
          scheduled_time: instaDate.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      scheduledPosts.push(instaPost);
    }

    // Save Facebook post
    if (post.facebook) {
      const fbDate = new Date(postDate);
      fbDate.setHours(fbDate.getHours() + 9); // 9 hours after Twitter

      const { data: fbPost } = await supabase
        .from('scheduled_posts')
        .insert([{
          client_id: clientId,
          platform: 'facebook',
          content: post.facebook.text,
          hashtags: post.facebook.hashtags,
          scheduled_time: fbDate.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      scheduledPosts.push(fbPost);
    }
  }

  return scheduledPosts;
};

// Post to platform (placeholder - integrate with actual APIs)
const postToPlatform = async (post) => {
  console.log(`   📤 Posting to ${post.platform}: "${post.content.substring(0, 50)}..."`);

  // TODO: Integrate with actual platform APIs
  // - Twitter API v2
  // - LinkedIn API
  // - Instagram Graph API
  // - Facebook Graph API

  // For now, just mark as posted
  const { data } = await supabase
    .from('scheduled_posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString()
    })
    .eq('id', post.id)
    .select()
    .single();

  return data;
};

// Check and post scheduled content
export const publishScheduledPosts = async () => {
  console.log('\n📅 CHECKING SCHEDULED POSTS...\n');

  const now = new Date().toISOString();

  // Get posts scheduled for now or earlier
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_time', now)
    .order('scheduled_time', { ascending: true })
    .limit(20);

  if (!posts || posts.length === 0) {
    console.log('No posts scheduled for now.\n');
    return [];
  }

  console.log(`Found ${posts.length} posts to publish\n`);

  const published = [];

  for (const post of posts) {
    try {
      const result = await postToPlatform(post);
      console.log(`   ✅ Published to ${post.platform}`);
      published.push(result);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ⚠️  Failed: ${error.message}`);

      // Mark as failed
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', post.id);
    }
  }

  console.log(`\n✅ Published ${published.length}/${posts.length} posts\n`);
  return published;
};

// Main execution - generate content for client
export const runSocialMediaManager = async (clientId) => {
  console.log('\n🚀 SOCIAL MEDIA MANAGER STARTING...\n');

  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  console.log(`Client: ${client.company_name}`);
  console.log(`Industry: ${client.industry}\n`);

  try {
    // 1. Generate 7-day content calendar
    console.log('📝 Generating 7-day content calendar...\n');
    const calendar = await generateContentCalendar(client);
    console.log(`   ✅ Generated ${calendar.length} days of content\n`);

    // 2. Save to schedule
    console.log('💾 Scheduling posts...\n');
    const scheduled = await savePostsToSchedule(clientId, calendar);
    console.log(`   ✅ Scheduled ${scheduled.length} posts\n`);

    // Summary
    console.log('='.repeat(80));
    console.log(`\n📈 SOCIAL MEDIA CALENDAR CREATED\n`);
    console.log(`   Client: ${client.company_name}`);
    console.log(`   Posts scheduled: ${scheduled.length}`);
    console.log(`   Platforms: Twitter, LinkedIn, Instagram, Facebook`);
    console.log(`   Duration: 7 days`);
    console.log('\n' + '='.repeat(80) + '\n');

    return { calendar, scheduled };

  } catch (error) {
    console.error('\n❌ Social media manager failed:', error);
    throw error;
  }
};

// Batch process all active social media clients
export const runSocialMediaAgency = async () => {
  console.log('\n🚀 SOCIAL MEDIA AGENCY STARTING...\n');

  // Get all active social media clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('service', 'social_media')
    .eq('status', 'active');

  if (!clients || clients.length === 0) {
    console.log('No active social media clients found.\n');
    return [];
  }

  console.log(`📊 Found ${clients.length} active clients\n`);

  const results = [];

  for (const client of clients) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\nProcessing: ${client.company_name}\n`);

    try {
      const result = await runSocialMediaManager(client.id);
      results.push({ client: client.company_name, success: true, posts: result.scheduled.length });
    } catch (error) {
      results.push({ client: client.company_name, success: false, error: error.message });
    }

    // Rate limit between clients
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 SOCIAL MEDIA AGENCY RUN COMPLETE\n`);
  console.log(`   Clients processed: ${clients.length}`);
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  console.log(`   Total posts scheduled: ${results.filter(r => r.success).reduce((sum, r) => sum + r.posts, 0)}`);
  console.log('\n' + '='.repeat(80) + '\n');

  return results;
};

// Get analytics for client
export const getSocialMediaStats = async (clientId) => {
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('client_id', clientId);

  const stats = {
    totalScheduled: posts?.filter(p => p.status === 'scheduled').length || 0,
    totalPosted: posts?.filter(p => p.status === 'posted').length || 0,
    totalFailed: posts?.filter(p => p.status === 'failed').length || 0,
    byPlatform: {
      twitter: posts?.filter(p => p.platform === 'twitter' && p.status === 'posted').length || 0,
      linkedin: posts?.filter(p => p.platform === 'linkedin' && p.status === 'posted').length || 0,
      instagram: posts?.filter(p => p.platform === 'instagram' && p.status === 'posted').length || 0,
      facebook: posts?.filter(p => p.platform === 'facebook' && p.status === 'posted').length || 0
    }
  };

  console.log(`\n📊 Social Media Stats for Client ${clientId}\n`);
  console.log(`   Scheduled: ${stats.totalScheduled}`);
  console.log(`   Posted: ${stats.totalPosted}`);
  console.log(`   Failed: ${stats.totalFailed}`);
  console.log(`\n   By Platform:`);
  console.log(`     Twitter: ${stats.byPlatform.twitter}`);
  console.log(`     LinkedIn: ${stats.byPlatform.linkedin}`);
  console.log(`     Instagram: ${stats.byPlatform.instagram}`);
  console.log(`     Facebook: ${stats.byPlatform.facebook}\n`);

  return stats;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const clientId = process.argv[2];

  if (!clientId) {
    console.error('Usage: node social-manager.js <clientId>');
    process.exit(1);
  }

  runSocialMediaManager(clientId)
    .then(result => {
      console.log(`\n✅ Created ${result.scheduled.length} scheduled posts\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Social media manager failed:', error);
      process.exit(1);
    });
}
