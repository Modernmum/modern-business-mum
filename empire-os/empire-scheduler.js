/**
 * EMPIRE OS MASTER SCHEDULER
 * Orchestrates all automation agents across all businesses
 */

import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';

// Import all agents
import { runLeadGeneration } from './agents/lead-scraper.js';
import { runContentAgency } from './agents/content-writer.js';
import { sendScheduledFollowUps } from './agents/cold-email.js';
import { populateJobBoard } from './agents/job-board.js';
import { publishScheduledPosts, runSocialMediaAgency } from './agents/social-manager.js';
import { runSEOAgency } from './agents/seo-service.js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('\n🚀 EMPIRE OS MASTER SCHEDULER STARTING...\n');

// Track last run times
const runHistory = {
  leadGen: null,
  content: null,
  coldEmail: null,
  jobBoard: null,
  socialPosts: null,
  seo: null
};

// LEAD GENERATION ENGINE
// Runs every Monday at 9:00 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('\n⏰ [LEAD GEN] Starting weekly lead generation...\n');
  try {
    const leads = await runLeadGeneration('SaaS', 3);
    runHistory.leadGen = new Date();
    console.log(`✅ [LEAD GEN] Generated ${leads.length} qualified leads\n`);
  } catch (error) {
    console.error(`❌ [LEAD GEN] Error: ${error.message}\n`);
  }
});

// CONTENT AGENCY
// Runs every day at 6:00 AM
cron.schedule('0 6 * * *', async () => {
  console.log('\n⏰ [CONTENT] Starting daily content generation...\n');
  try {
    const results = await runContentAgency();
    runHistory.content = new Date();
    console.log(`✅ [CONTENT] Generated content for ${results.length} clients\n`);
  } catch (error) {
    console.error(`❌ [CONTENT] Error: ${error.message}\n`);
  }
});

// COLD EMAIL FOLLOW-UPS
// Runs every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('\n⏰ [EMAIL] Sending scheduled follow-ups...\n');
  try {
    await sendScheduledFollowUps();
    runHistory.coldEmail = new Date();
    console.log(`✅ [EMAIL] Follow-ups sent\n`);
  } catch (error) {
    console.error(`❌ [EMAIL] Error: ${error.message}\n`);
  }
});

// JOB BOARD POPULATION
// Runs every day at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('\n⏰ [JOB BOARD] Scraping new job listings...\n');
  try {
    const jobs = await populateJobBoard('Software Engineer', 'Remote', 30);
    runHistory.jobBoard = new Date();
    console.log(`✅ [JOB BOARD] Added ${jobs.length} new jobs\n`);
  } catch (error) {
    console.error(`❌ [JOB BOARD] Error: ${error.message}\n`);
  }
});

// SOCIAL MEDIA POSTS
// Publish scheduled posts every hour
cron.schedule('0 * * * *', async () => {
  console.log('\n⏰ [SOCIAL] Publishing scheduled posts...\n');
  try {
    const published = await publishScheduledPosts();
    runHistory.socialPosts = new Date();
    console.log(`✅ [SOCIAL] Published ${published.length} posts\n`);
  } catch (error) {
    console.error(`❌ [SOCIAL] Error: ${error.message}\n`);
  }
});

// SOCIAL MEDIA CONTENT GENERATION
// Generate new content calendars every Sunday at 10:00 AM
cron.schedule('0 10 * * 0', async () => {
  console.log('\n⏰ [SOCIAL] Generating weekly content calendars...\n');
  try {
    const results = await runSocialMediaAgency();
    console.log(`✅ [SOCIAL] Created calendars for ${results.length} clients\n`);
  } catch (error) {
    console.error(`❌ [SOCIAL] Error: ${error.message}\n`);
  }
});

// SEO CONTENT GENERATION
// Runs every Wednesday at 10:00 AM
cron.schedule('0 10 * * 3', async () => {
  console.log('\n⏰ [SEO] Starting weekly SEO content generation...\n');
  try {
    const results = await runSEOAgency();
    runHistory.seo = new Date();
    console.log(`✅ [SEO] Generated content for ${results.length} clients\n`);
  } catch (error) {
    console.error(`❌ [SEO] Error: ${error.message}\n`);
  }
});

// HEALTH CHECK & ANALYTICS
// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('\n⏰ [ANALYTICS] Daily empire report...\n');

  try {
    // Get metrics from all services
    const { data: leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });

    const { data: content } = await supabase
      .from('content')
      .select('*', { count: 'exact' });

    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' });

    const { data: jobs } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact' });

    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact' });

    const { data: seoContent } = await supabase
      .from('seo_content')
      .select('*', { count: 'exact' });

    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                     EMPIRE OS DAILY REPORT                    ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📊 BUSINESS METRICS:\n`);
    console.log(`   Active Clients: ${clients?.length || 0}`);
    console.log(`   Total Leads Generated: ${leads?.length || 0}`);
    console.log(`   Content Pieces Created: ${content?.length || 0}`);
    console.log(`   Email Campaigns Sent: ${campaigns?.filter(c => c.status === 'sent').length || 0}`);
    console.log(`   Job Listings Published: ${jobs?.length || 0}`);
    console.log(`   Social Posts Scheduled: ${posts?.filter(p => p.status === 'scheduled').length || 0}`);
    console.log(`   SEO Articles Written: ${seoContent?.length || 0}`);

    console.log(`\n⏰ LAST RUN TIMES:\n`);
    console.log(`   Lead Gen: ${runHistory.leadGen || 'Not run yet'}`);
    console.log(`   Content: ${runHistory.content || 'Not run yet'}`);
    console.log(`   Cold Email: ${runHistory.coldEmail || 'Not run yet'}`);
    console.log(`   Job Board: ${runHistory.jobBoard || 'Not run yet'}`);
    console.log(`   Social Posts: ${runHistory.socialPosts || 'Not run yet'}`);
    console.log(`   SEO: ${runHistory.seo || 'Not run yet'}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Save daily snapshot
    await supabase
      .from('daily_analytics')
      .insert([{
        date: new Date().toISOString().split('T')[0],
        active_clients: clients?.length || 0,
        leads_generated: leads?.length || 0,
        content_created: content?.length || 0,
        campaigns_sent: campaigns?.filter(c => c.status === 'sent').length || 0,
        jobs_posted: jobs?.length || 0,
        social_posts: posts?.length || 0,
        seo_articles: seoContent?.length || 0,
        created_at: new Date().toISOString()
      }]);

  } catch (error) {
    console.error(`❌ [ANALYTICS] Error: ${error.message}\n`);
  }
});

// Initial status message
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    EMPIRE OS SCHEDULER ACTIVE                 ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n📅 SCHEDULED JOBS:\n');
console.log('   • Lead Generation:      Every Monday at 9:00 AM');
console.log('   • Content Agency:       Daily at 6:00 AM');
console.log('   • Email Follow-ups:     Daily at 8:00 AM');
console.log('   • Job Board Scraper:    Daily at 3:00 AM');
console.log('   • Social Posts:         Hourly');
console.log('   • Social Calendars:     Every Sunday at 10:00 AM');
console.log('   • SEO Content:          Every Wednesday at 10:00 AM');
console.log('   • Daily Analytics:      Midnight');
console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('🤖 All automation agents ready. Waiting for scheduled times...\n');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\n🛑 Empire OS Scheduler shutting down...\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Empire OS Scheduler shutting down...\n');
  process.exit(0);
});

// Prevent process from exiting
setInterval(() => {
  // Keep alive
}, 1000 * 60 * 60); // Check every hour
