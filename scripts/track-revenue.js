/**
 * REVENUE TRACKER
 * Track progress toward $20,000 goal
 *
 * Usage: node scripts/track-revenue.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const GOAL = 20000;
const START_DATE = new Date('2025-11-28'); // Day 1 of challenge
const END_DATE = new Date(START_DATE.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

async function trackRevenue() {
  console.log('\n' + '='.repeat(80));
  console.log('💰 REVENUE TRACKER - $20K CHALLENGE');
  console.log('='.repeat(80) + '\n');

  const now = new Date();
  const daysElapsed = Math.floor((now - START_DATE) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.floor((END_DATE - now) / (24 * 60 * 60 * 1000));

  console.log(`📅 Day ${daysElapsed + 1} of 90 (${daysRemaining} days remaining)`);
  console.log(`🎯 Goal: $${GOAL.toLocaleString()}`);
  console.log('');

  // Get revenue from all sources
  const revenue = {
    notionTemplates: 0,
    aiOpsTeam: 0,
    fractionalCOO: 0,
    other: 0
  };

  // Notion Templates - query orders table
  const { data: orders } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', START_DATE.toISOString());

  if (orders && orders.length > 0) {
    revenue.notionTemplates = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  }

  // AI Ops Team - query subscriptions (assuming $500/month per client)
  const { data: clients } = await supabase
    .from('mbm_clients')
    .select('*')
    .eq('subscription_status', 'active')
    .gte('created_at', START_DATE.toISOString());

  if (clients && clients.length > 0) {
    revenue.aiOpsTeam = clients.length * 500;
  }

  // Fractional COO - manual entry (track separately)
  // This would need to be tracked in a separate table

  const totalRevenue = Object.values(revenue).reduce((sum, val) => sum + val, 0);
  const percentComplete = ((totalRevenue / GOAL) * 100).toFixed(1);
  const dailyTarget = GOAL / 90;
  const currentPace = daysElapsed > 0 ? totalRevenue / daysElapsed : 0;
  const projectedTotal = currentPace * 90;

  console.log('💵 REVENUE BREAKDOWN:');
  console.log(`   Notion Templates: $${revenue.notionTemplates.toFixed(2)}`);
  console.log(`   AI Ops Team:      $${revenue.aiOpsTeam.toFixed(2)}`);
  console.log(`   Fractional COO:   $${revenue.fractionalCOO.toFixed(2)}`);
  console.log(`   Other:            $${revenue.other.toFixed(2)}`);
  console.log('');
  console.log(`📊 TOTAL REVENUE: $${totalRevenue.toFixed(2)} (${percentComplete}% of goal)`);
  console.log('');

  // Progress bar
  const barLength = 50;
  const filledLength = Math.round((totalRevenue / GOAL) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`   [${bar}]`);
  console.log('');

  // Pacing analysis
  console.log('📈 PACING ANALYSIS:');
  console.log(`   Daily Target:     $${dailyTarget.toFixed(2)}`);
  console.log(`   Current Pace:     $${currentPace.toFixed(2)}/day`);
  console.log(`   Projected Total:  $${projectedTotal.toFixed(2)}`);

  if (projectedTotal >= GOAL) {
    console.log(`   Status: ✅ ON TRACK (${((projectedTotal - GOAL) / GOAL * 100).toFixed(1)}% ahead)`);
  } else {
    console.log(`   Status: ⚠️  BEHIND (${((GOAL - projectedTotal) / GOAL * 100).toFixed(1)}% short)`);
  }
  console.log('');

  // What's needed
  const remainingRevenue = GOAL - totalRevenue;
  const neededPerDay = remainingRevenue / daysRemaining;

  console.log('🎯 WHAT\'S NEEDED:');
  console.log(`   Remaining:        $${remainingRevenue.toFixed(2)}`);
  console.log(`   Needed per day:   $${neededPerDay.toFixed(2)}`);
  console.log('');

  // Conversion scenarios
  console.log('💡 CONVERSION SCENARIOS:');
  const aiOpsNeeded = Math.ceil(remainingRevenue / 500);
  const templatesNeeded = Math.ceil(remainingRevenue / 29);
  const cooHoursNeeded = Math.ceil(remainingRevenue / 150);

  console.log(`   ${aiOpsNeeded} AI Ops Team signups ($500/month each)`);
  console.log(`   ${templatesNeeded} Notion Template sales ($29 average)`);
  console.log(`   ${cooHoursNeeded} COO hours ($150/hour)`);
  console.log('');

  // Recent activity
  console.log('📱 RECENT ACTIVITY:');

  const { data: recentCampaigns } = await supabase
    .from('traffic_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (recentCampaigns && recentCampaigns.length > 0) {
    recentCampaigns.forEach(campaign => {
      const date = new Date(campaign.created_at).toLocaleDateString();
      const channels = campaign.channels_used.join(', ');
      console.log(`   ${date}: Posted to ${channels}`);
    });
  } else {
    console.log('   No campaigns yet');
  }

  console.log('');
  console.log('='.repeat(80) + '\n');
}

trackRevenue()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
