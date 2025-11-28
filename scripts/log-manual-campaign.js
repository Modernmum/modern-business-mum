/**
 * MANUAL CAMPAIGN LOGGER
 * Track manually posted campaigns in the database
 *
 * Usage: node scripts/log-manual-campaign.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function logManualCampaign() {
  console.log('\n📝 LOGGING MANUAL CAMPAIGN\n');

  const campaign = {
    product_id: 'ai-ops-team',
    channels_used: ['twitter', 'linkedin', 'reddit', 'email'],
    results: {
      twitter: {
        success: true,
        platform: 'twitter',
        manual: true,
        posted_at: new Date().toISOString(),
        thread_size: 5,
        url: 'https://twitter.com/modernbusinessmum' // Update with actual URL after posting
      },
      linkedin: {
        success: true,
        platform: 'linkedin',
        manual: true,
        posted_at: new Date().toISOString(),
        url: 'https://linkedin.com/in/kristi-stokely' // Update with actual URL after posting
      },
      reddit: {
        success: true,
        platform: 'reddit',
        manual: true,
        posted_at: new Date().toISOString(),
        subreddit: 'entrepreneur',
        url: 'https://reddit.com/r/entrepreneur' // Update with actual URL after posting
      },
      email: {
        success: true,
        platform: 'email',
        manual: true,
        sent_at: new Date().toISOString(),
        recipients: 10
      }
    },
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('traffic_campaigns')
    .insert(campaign)
    .select()
    .single();

  if (error) {
    console.error('❌ Error logging campaign:', error.message);
    process.exit(1);
  }

  console.log('✅ Campaign logged successfully!');
  console.log(`📊 Campaign ID: ${data.id}`);
  console.log(`📅 Posted at: ${new Date(data.created_at).toLocaleString()}`);
  console.log(`📱 Channels: ${data.channels_used.join(', ')}`);
  console.log('\n📈 Expected in 48 hours:');
  console.log('   • 2-5 demo requests');
  console.log('   • 0-1 trial signup');
  console.log('   • $500 MRR if conversion happens\n');

  process.exit(0);
}

logManualCampaign();
