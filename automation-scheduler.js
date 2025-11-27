/**
 * AUTOMATION SCHEDULER
 * Runs all automation agents on schedule - 100% hands-free operation
 *
 * This is your "money printer" - set it and forget it!
 */

import cron from 'node-cron';
import { runFiverrAutomation } from './agents/fiverr-automation.js';
import { runSocialMediaCampaign } from './agents/social-media-poster.js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);

console.log('\n' + '='.repeat(80));
console.log('🤖 ZERO TO LEGACY ENGINE - FULL AUTOMATION SCHEDULER');
console.log('='.repeat(80) + '\n');

/**
 * Run full product creation cycle
 */
const runProductCycle = async () => {
  console.log('\n⏰ [CYCLE] Running product creation cycle...\n');
  try {
    const { stdout, stderr } = await execAsync('node run-cycle.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('❌ Cycle error:', error.message);
  }
};

/**
 * Run social media posting
 */
const runSocialPosting = async () => {
  console.log('\n⏰ [SOCIAL] Running social media campaign...\n');
  try {
    await runSocialMediaCampaign();
  } catch (error) {
    console.error('❌ Social posting error:', error.message);
  }
};

/**
 * Check Fiverr for new orders
 */
const checkFiverr = async () => {
  console.log('\n⏰ [FIVERR] Checking for new orders...\n');
  try {
    await runFiverrAutomation();
  } catch (error) {
    console.error('❌ Fiverr check error:', error.message);
  }
};

/**
 * Daily summary
 */
const dailySummary = async () => {
  console.log('\n📊 DAILY SUMMARY\n');
  console.log('Generating revenue report...');
  // TODO: Fetch from database and display stats
};

// ============================================================================
// SCHEDULE CONFIGURATION
// ============================================================================

console.log('📅 SCHEDULE:\n');
console.log('   🔄 Product Creation: 9:00 AM & 9:00 PM daily');
console.log('   📱 Social Media: 10:00 AM, 2:00 PM, 6:00 PM daily');
console.log('   💼 Fiverr Check: Every hour');
console.log('   📊 Daily Summary: 11:59 PM daily\n');

console.log('🚀 Scheduler is now running...\n');
console.log('💡 TIP: Run with PM2 to keep it alive 24/7:');
console.log('   pm2 start automation-scheduler.js --name wealth-engine\n');

console.log('='.repeat(80) + '\n');

// ============================================================================
// CRON JOBS
// ============================================================================

// Check Fiverr every hour
cron.schedule('0 * * * *', async () => {
  await checkFiverr();
});

// Run product creation cycle at 9 AM and 9 PM
cron.schedule('0 9,21 * * *', async () => {
  await runProductCycle();
});

// Post to social media at 10 AM, 2 PM, and 6 PM
cron.schedule('0 10,14,18 * * *', async () => {
  await runSocialPosting();
});

// Daily summary at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  await dailySummary();
});

// ============================================================================
// STARTUP ACTIONS
// ============================================================================

// Run Fiverr check immediately on startup
console.log('🎬 Running initial Fiverr check...\n');
checkFiverr().then(() => {
  console.log('\n✅ Initial check complete. Waiting for scheduled tasks...\n');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down scheduler...');
  console.log('💰 Final stats: [Revenue tracking coming soon]');
  console.log('\n✨ Thanks for using Zero to Legacy Engine!\n');
  process.exit(0);
});
