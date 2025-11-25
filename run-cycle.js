#!/usr/bin/env node

/**
 * ZERO TO LEGACY ENGINE - Main Orchestrator
 * Runs the complete cycle: Scout → Creator → Executor
 */

import dotenv from 'dotenv';
import { runScout, getScoutStatus } from './agents/scout.js';
import { runCreator, getCreatorStatus } from './agents/creator.js';
import { runExecutor, getExecutorStatus } from './agents/executor.js';
import { testConnection as testDbConnection, getSystemStats } from './lib/database.js';
import { testConnection as testAiConnection } from './lib/ai.js';
import { CONFIG } from './config/settings.js';

dotenv.config();

/**
 * Print system banner
 */
const printBanner = () => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║        🚀  ZERO TO LEGACY WEALTH ENGINE  🚀          ║');
  console.log('║                                                       ║');
  console.log('║    Autonomous AI System for Notion Templates         ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
};

/**
 * Print system stats
 */
const printStats = async () => {
  try {
    const stats = await getSystemStats();

    console.log('\n📊 SYSTEM STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Opportunities Discovered: ${stats.opportunities}`);
    console.log(`  Products Created:         ${stats.products}`);
    console.log(`  Listings Created:         ${stats.listings}`);
    console.log(`  Total Sales:              ${stats.totalSales}`);
    console.log(`  Total Revenue:            $${stats.totalRevenue}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('⚠️  Could not fetch system stats:', error.message);
  }
};

/**
 * Test system connections
 */
const testConnections = async () => {
  console.log('🔧 TESTING SYSTEM CONNECTIONS...\n');

  // Test database
  console.log('  Testing Supabase connection...');
  const dbTest = await testDbConnection();
  if (dbTest.success) {
    console.log('  ✅ Database connected');
  } else {
    console.log('  ❌ Database connection failed:', dbTest.message);
    return false;
  }

  // Test AI
  console.log('  Testing Claude AI connection...');
  const aiTest = await testAiConnection();
  if (aiTest.success) {
    console.log('  ✅ AI connected');
  } else {
    console.log('  ❌ AI connection failed:', aiTest.message);
    return false;
  }

  // Check Gumroad API key
  console.log('  Checking Gumroad API key...');
  if (process.env.GUMROAD_API_KEY) {
    console.log('  ✅ Gumroad API key found');
  } else {
    console.log('  ⚠️  Gumroad API key not found (will use manual instructions)');
  }

  console.log('\n✅ All essential connections successful\n');
  return true;
};

/**
 * Print agent statuses
 */
const printAgentStatuses = async () => {
  console.log('📋 AGENT STATUS\n');

  try {
    const scoutStatus = await getScoutStatus();
    console.log('  🔍 SCOUT AGENT:');
    console.log(`     Opportunities in queue: ${scoutStatus.opportunities_in_queue}/${scoutStatus.max_queue_size}`);
    console.log(`     Queue full: ${scoutStatus.queue_full ? 'Yes' : 'No'}`);
    console.log(`     Discovery rate: ${scoutStatus.opportunities_per_cycle} per cycle\n`);

    const creatorStatus = await getCreatorStatus();
    console.log('  🎨 CREATOR AGENT:');
    console.log(`     Products in queue: ${creatorStatus.products_in_queue}/${creatorStatus.max_queue_size}`);
    console.log(`     Queue full: ${creatorStatus.queue_full ? 'Yes' : 'No'}`);
    console.log(`     Creation rate: ${creatorStatus.max_creations_per_cycle} per cycle\n`);

    const executorStatus = await getExecutorStatus();
    console.log('  🚀 EXECUTOR AGENT:');
    console.log(`     Products ready to list: ${executorStatus.products_ready_to_list}`);
    console.log(`     Listing rate: ${executorStatus.max_listings_per_cycle} per cycle`);
    console.log(`     Platform: ${executorStatus.default_platform}`);
    console.log(`     Auto-publish: ${executorStatus.auto_publish ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.error('⚠️  Could not fetch agent statuses:', error.message);
  }
};

/**
 * Run a complete cycle
 */
const runCycle = async () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                  STARTING NEW CYCLE                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  const cycleStart = Date.now();
  const results = {
    scout: null,
    creator: null,
    executor: null,
    errors: [],
  };

  // Run Scout Agent
  try {
    results.scout = await runScout();
  } catch (error) {
    console.error('❌ Scout Agent failed:', error.message);
    results.errors.push({ agent: 'scout', error: error.message });
  }

  // Run Creator Agent
  try {
    results.creator = await runCreator();
  } catch (error) {
    console.error('❌ Creator Agent failed:', error.message);
    results.errors.push({ agent: 'creator', error: error.message });
  }

  // Run Executor Agent
  try {
    results.executor = await runExecutor();
  } catch (error) {
    console.error('❌ Executor Agent failed:', error.message);
    results.errors.push({ agent: 'executor', error: error.message });
  }

  const cycleTime = ((Date.now() - cycleStart) / 1000).toFixed(2);

  // Print cycle summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                   CYCLE COMPLETE                      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📈 CYCLE SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Cycle Duration:        ${cycleTime}s`);
  console.log(`  Opportunities Found:   ${results.scout?.discovered || 0}`);
  console.log(`  Products Created:      ${results.creator?.created || 0}`);
  console.log(`  Products Listed:       ${results.executor?.listed || 0}`);
  console.log(`  Errors:                ${results.errors.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORS:');
    results.errors.forEach((err) => {
      console.log(`  - ${err.agent}: ${err.error}`);
    });
    console.log();
  }

  return results;
};

/**
 * Main execution
 */
const main = async () => {
  try {
    printBanner();

    // Test connections
    const connectionsOk = await testConnections();
    if (!connectionsOk) {
      console.error('❌ System connections failed. Please check your .env file.\n');
      process.exit(1);
    }

    // Print current stats
    await printStats();

    // Print agent statuses
    await printAgentStatuses();

    // Check for continuous mode
    const continuousMode = process.argv.includes('--continuous') || process.argv.includes('-c');
    const intervalMinutes = parseInt(process.argv.find((arg) => arg.startsWith('--interval='))?.split('=')[1]) || 60;

    if (continuousMode) {
      console.log(`🔄 CONTINUOUS MODE ENABLED`);
      console.log(`   Running cycle every ${intervalMinutes} minutes`);
      console.log(`   Press Ctrl+C to stop\n`);

      // Run first cycle immediately
      await runCycle();

      // Schedule subsequent cycles
      setInterval(async () => {
        console.log(`\n\n⏰ Starting scheduled cycle...\n`);
        await runCycle();
      }, intervalMinutes * 60 * 1000);
    } else {
      // Single cycle mode
      await runCycle();

      // Print final stats
      await printStats();

      console.log('✅ Zero to Legacy Engine cycle completed successfully!\n');
      console.log('💡 TIP: Run with --continuous flag for automatic cycles\n');
      console.log('   Example: node run-cycle.js --continuous --interval=30\n');
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down Zero to Legacy Engine...');
  console.log('   Goodbye!\n');
  process.exit(0);
});

// Run the engine
main();
