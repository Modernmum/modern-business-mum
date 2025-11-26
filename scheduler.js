/**
 * ZERO TO LEGACY ENGINE - MASTER SCHEDULER
 * The complete automated money-making machine
 *
 * RUNS 24/7:
 * - Auto-creates products
 * - Auto-posts to social media
 * - Auto-processes custom template orders
 * - Auto-sends email campaigns
 *
 * SET IT AND FORGET IT
 */

import { scheduleAutomatedPosting } from './agents/puppeteer-poster.js';
import { runProductCreationCycle } from './run-cycle.js';
import { logAction } from './lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n');
console.log('═'.repeat(60));
console.log('🚀 ZERO TO LEGACY ENGINE - FULL AUTOMATION MODE');
console.log('═'.repeat(60));
console.log('\n');

/**
 * Check system configuration
 */
const checkConfiguration = () => {
  console.log('📋 SYSTEM CHECK:\n');

  const checks = {
    'Anthropic API': !!process.env.ANTHROPIC_API_KEY,
    'Stripe API': !!process.env.STRIPE_SECRET_KEY,
    'Resend Email': !!process.env.RESEND_API_KEY,
    'Supabase': !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY,
    'Reddit Login': !!process.env.REDDIT_USERNAME && !!process.env.REDDIT_PASSWORD,
    'Facebook Login': !!process.env.FACEBOOK_EMAIL && !!process.env.FACEBOOK_PASSWORD,
    'LinkedIn Login': !!process.env.LINKEDIN_EMAIL && !!process.env.LINKEDIN_PASSWORD,
    'Pinterest': !!process.env.PINTEREST_ACCESS_TOKEN,
    'YouTube': !!process.env.YOUTUBE_REFRESH_TOKEN,
    'Perplexity': !!process.env.PERPLEXITY_API_KEY,
  };

  Object.entries(checks).forEach(([name, configured]) => {
    const status = configured ? '✅' : '⚠️ ';
    console.log(`   ${status} ${name}`);
  });

  console.log('\n');

  const essentialChecks = [
    checks['Anthropic API'],
    checks['Stripe API'],
    checks['Resend Email'],
    checks['Supabase'],
  ];

  if (!essentialChecks.every(check => check)) {
    console.log('❌ MISSING ESSENTIAL CONFIGURATION\n');
    console.log('Add missing API keys to .env file before running.\n');
    process.exit(1);
  }

  console.log('✅ Essential systems configured\n');

  if (!checks['Reddit Login'] && !checks['Facebook Login'] && !checks['LinkedIn Login']) {
    console.log('⚠️  Social media automation disabled (no credentials)\n');
    console.log('Add browser automation credentials to .env to enable auto-posting\n');
  }
};

/**
 * Log system startup
 */
const logStartup = async () => {
  await logAction('scheduler', 'system_started', 'success', {
    node_version: process.version,
    platform: process.platform,
  });
};

/**
 * Main scheduler
 */
const startScheduler = async () => {
  console.log('⚙️  INITIALIZING SYSTEMS:\n');

  try {
    // Log startup
    await logStartup();
    console.log('   ✅ Database connected');

    // Schedule product creation (every 6 hours)
    console.log('   ⏰ Scheduling product creation (every 6 hours)');
    setInterval(async () => {
      console.log('\n🔄 AUTO-RUNNING PRODUCT CREATION CYCLE...\n');
      try {
        await runProductCreationCycle();
      } catch (error) {
        console.error('❌ Product creation failed:', error.message);
      }
    }, 6 * 60 * 60 * 1000);

    // Run immediately on startup
    console.log('   🚀 Running initial product creation cycle...\n');
    setTimeout(() => runProductCreationCycle(), 5000);

    // Schedule social media posting (every 2 days)
    if (process.env.REDDIT_USERNAME || process.env.FACEBOOK_EMAIL || process.env.LINKEDIN_EMAIL) {
      console.log('   ⏰ Scheduling social media posts (every 2 days)');
      scheduleAutomatedPosting(2 * 24 * 60 * 60 * 1000);
    } else {
      console.log('   ⚠️  Social media automation skipped (no credentials)');
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('═'.repeat(60));
    console.log('\n');

    console.log('📊 ACTIVE AUTOMATIONS:\n');
    console.log('   🎨 Product Creation: Every 6 hours');
    if (process.env.REDDIT_USERNAME || process.env.FACEBOOK_EMAIL || process.env.LINKEDIN_EMAIL) {
      console.log('   📱 Social Media Posts: Every 2 days');
    }
    console.log('   💌 Email Marketing: On purchase');
    console.log('   🎯 Custom Templates: On-demand (via API)');
    console.log('   📈 Dashboard: http://localhost:3001/dashboard.html');
    console.log('\n');

    console.log('💰 REVENUE STREAMS:\n');
    console.log('   • Pre-made templates ($19-47 each)');
    console.log('   • Custom template service ($100-500 per order)');
    console.log('   • Complete Notion setup ($200-1000)');
    console.log('   • Consulting ($100-200/hour)');
    console.log('\n');

    console.log('🤖 THE MACHINE IS RUNNING...\n');
    console.log('Press Ctrl+C to stop\n');

    // Heartbeat (log every hour to show system is alive)
    setInterval(async () => {
      const now = new Date().toLocaleString();
      console.log(`💚 [${now}] System running...`);

      await logAction('scheduler', 'heartbeat', 'success', {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    }, 60 * 60 * 1000); // Every hour

  } catch (error) {
    console.error('\n❌ SCHEDULER FAILED TO START:', error.message);
    console.error(error.stack);

    await logAction('scheduler', 'startup_failed', 'error', {
      error: error.message,
    });

    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async (signal) => {
  console.log(`\n\n🛑 Received ${signal}, shutting down gracefully...\n`);

  await logAction('scheduler', 'system_stopped', 'success', {
    signal,
    uptime: process.uptime(),
  });

  console.log('✅ Shutdown complete\n');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('unhandledRejection', async (error) => {
  console.error('\n❌ UNHANDLED REJECTION:', error);

  await logAction('scheduler', 'unhandled_error', 'error', {
    error: error.message,
    stack: error.stack,
  });
});

process.on('uncaughtException', async (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', error);

  await logAction('scheduler', 'uncaught_exception', 'error', {
    error: error.message,
    stack: error.stack,
  });

  process.exit(1);
});

// Start the scheduler
checkConfiguration();
startScheduler();
