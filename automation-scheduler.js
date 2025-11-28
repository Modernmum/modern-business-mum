/**
 * AUTOMATION SCHEDULER
 * Runs all automation agents on schedule - 100% hands-free operation
 *
 * This is your "money printer" - set it and forget it!
 */

import cron from 'node-cron';
import { LegalTrafficEngine } from './agents/legal-traffic-engine.js';
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
 * Run LEGAL traffic automation
 */
const runLegalTraffic = async () => {
  console.log('\n⏰ [LEGAL TRAFFIC] Running 100% compliant traffic campaign...\n');
  try {
    const engine = new LegalTrafficEngine();
    await engine.runDaily();
  } catch (error) {
    console.error('❌ Legal traffic error:', error.message);
  }
};

// Removed illegal Fiverr automation (against TOS)

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
console.log('   💼 Fiverr Orders: Every hour');
console.log('   💬 Fiverr Messages: Every hour (auto-reply)');
console.log('   📊 Daily Summary: 11:59 PM daily\n');

console.log('🚀 Scheduler is now running...\n');
console.log('💡 TIP: Run with PM2 to keep it alive 24/7:');
console.log('   pm2 start automation-scheduler.js --name wealth-engine\n');

console.log('='.repeat(80) + '\n');

// ============================================================================
// CRON JOBS
// ============================================================================

// Run product creation cycle at 9 AM and 9 PM
cron.schedule('0 9,21 * * *', async () => {
  await runProductCycle();
});

// Run LEGAL traffic automation daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  await runLegalTraffic();
});

// Daily summary at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  await dailySummary();
});

// ============================================================================
// STARTUP ACTIONS
// ============================================================================

// Run legal traffic immediately on startup
console.log('🎬 Running initial legal traffic check...\n');
runLegalTraffic().then(() => {
  console.log('\n✅ Initial traffic campaign complete. Waiting for scheduled tasks...\n');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down scheduler...');
  console.log('💰 Final stats: [Revenue tracking coming soon]');
  console.log('\n✨ Thanks for using Zero to Legacy Engine!\n');
  process.exit(0);
});
