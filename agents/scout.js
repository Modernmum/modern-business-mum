/**
 * SCOUT AGENT
 * Discovers opportunities from configured categories and stores them in the database
 */

import { CONFIG, getAllCategories } from '../config/settings.js';
import {
  createOpportunity,
  getOpportunities,
  logAction,
} from '../lib/database.js';
import {
  scoreOpportunity,
  generateOpportunityDescription,
} from '../lib/ai.js';

/**
 * Main Scout Agent execution
 */
export const runScout = async () => {
  console.log('\n🔍 SCOUT AGENT STARTING...\n');

  try {
    // Log start
    await logAction('scout', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Check if we have too many opportunities in queue
    const queuedOpportunities = await getOpportunities({ status: 'discovered' });
    if (queuedOpportunities.length >= CONFIG.thresholds.maxOpportunitiesInQueue) {
      console.log(`⚠️  Queue full (${queuedOpportunities.length} opportunities). Skipping discovery.`);
      await logAction('scout', 'run_skipped', 'success', {
        reason: 'queue_full',
        queue_size: queuedOpportunities.length,
      });
      return { discovered: 0, skipped: true };
    }

    // Get all available categories
    const allCategories = getAllCategories();
    console.log(`📋 Total available categories: ${allCategories.length}`);

    // Shuffle and select opportunities to discover
    const shuffled = allCategories.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, CONFIG.agents.scout.opportunitiesPerCycle);

    console.log(`🎯 Discovering ${selected.length} opportunities...\n`);

    const discovered = [];

    for (const category of selected) {
      try {
        console.log(`\n  Analyzing: ${category.type} (${category.niche})`);

        // Generate opportunity description using AI
        const description = await generateOpportunityDescription(
          category.type,
          category.niche,
          category.keywords
        );

        // Score the opportunity
        const trendScore = await scoreOpportunity(
          category.type,
          category.niche,
          category.keywords
        );

        console.log(`  📊 Trend Score: ${trendScore}/100`);

        // Check if score meets threshold
        if (trendScore < CONFIG.agents.scout.trendScoreThreshold) {
          console.log(`  ⏭️  Score too low (threshold: ${CONFIG.agents.scout.trendScoreThreshold})`);
          continue;
        }

        // Create opportunity in database
        const opportunity = await createOpportunity({
          type: category.type,
          niche: category.niche,
          title: `${category.type} for ${CONFIG.niches[category.niche].name}`,
          description: description,
          trend_score: trendScore,
          status: 'discovered',
        });

        console.log(`  ✅ Opportunity created: ${opportunity.id}`);

        discovered.push(opportunity);

        // Log successful discovery
        await logAction('scout', 'opportunity_discovered', 'success', {
          opportunity_id: opportunity.id,
          type: category.type,
          niche: category.niche,
          trend_score: trendScore,
        });
      } catch (error) {
        console.error(`  ❌ Error processing ${category.type}:`, error.message);

        await logAction('scout', 'opportunity_discovery_failed', 'error', {
          type: category.type,
          niche: category.niche,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Scout Agent completed. Discovered: ${discovered.length} opportunities\n`);

    // Log completion
    await logAction('scout', 'run_completed', 'success', {
      discovered_count: discovered.length,
      timestamp: new Date().toISOString(),
    });

    return {
      discovered: discovered.length,
      opportunities: discovered,
    };
  } catch (error) {
    console.error('❌ Scout Agent failed:', error.message);

    await logAction('scout', 'run_failed', 'error', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Get Scout Agent status
 */
export const getScoutStatus = async () => {
  const opportunities = await getOpportunities({ status: 'discovered' });
  const queueFull =
    opportunities.length >= CONFIG.thresholds.maxOpportunitiesInQueue;

  return {
    opportunities_in_queue: opportunities.length,
    max_queue_size: CONFIG.thresholds.maxOpportunitiesInQueue,
    queue_full: queueFull,
    opportunities_per_cycle: CONFIG.agents.scout.opportunitiesPerCycle,
    trend_score_threshold: CONFIG.agents.scout.trendScoreThreshold,
  };
};

// Run standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runScout()
    .then((result) => {
      console.log('Scout Agent Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scout Agent Error:', error);
      process.exit(1);
    });
}

export default { runScout, getScoutStatus };
