/**
 * CREATOR AGENT
 * Takes opportunities and builds complete Notion template structures
 */

import { CONFIG, getCategoryByType } from '../config/settings.js';
import {
  getOpportunities,
  updateOpportunityStatus,
  createProduct,
  getProducts,
  logAction,
} from '../lib/database.js';
import {
  generateTemplateStructure,
  generateSalesDescription,
} from '../lib/ai.js';
import { saveTemplateToFile, generatePDFGuide } from '../lib/template-generator.js';

/**
 * Main Creator Agent execution
 */
export const runCreator = async () => {
  console.log('\n🎨 CREATOR AGENT STARTING...\n');

  try {
    // Log start
    await logAction('creator', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Check if we have too many products in queue
    const queuedProducts = await getProducts({ status: 'created' });
    if (queuedProducts.length >= CONFIG.thresholds.maxProductsInQueue) {
      console.log(`⚠️  Queue full (${queuedProducts.length} products). Skipping creation.`);
      await logAction('creator', 'run_skipped', 'success', {
        reason: 'queue_full',
        queue_size: queuedProducts.length,
      });
      return { created: 0, skipped: true };
    }

    // Get discovered opportunities
    const opportunities = await getOpportunities({
      status: 'discovered',
      limit: CONFIG.agents.creator.maxCreationsPerCycle,
    });

    if (opportunities.length === 0) {
      console.log('ℹ️  No opportunities available to create products.');
      await logAction('creator', 'run_completed', 'success', {
        created_count: 0,
        reason: 'no_opportunities',
      });
      return { created: 0, opportunities: [] };
    }

    console.log(`📦 Creating products for ${opportunities.length} opportunities...\n`);

    const created = [];

    for (const opportunity of opportunities) {
      try {
        console.log(`\n  Creating: ${opportunity.title}`);
        console.log(`  Type: ${opportunity.type} | Niche: ${opportunity.niche}`);

        // Mark opportunity as in progress
        await updateOpportunityStatus(opportunity.id, 'in_progress');

        // Get category information for pricing
        const category = getCategoryByType(opportunity.type);
        const suggestedPrice = category?.price || 25;

        // Generate template structure using AI
        console.log(`  🤖 Generating template structure...`);
        const templateStructure = await generateTemplateStructure(
          opportunity.type,
          opportunity.niche,
          opportunity.description
        );

        console.log(`  ✓ Generated: ${templateStructure.features?.length || 0} features`);

        // Validate features count
        if (
          !templateStructure.features ||
          templateStructure.features.length < CONFIG.agents.creator.minFeaturesCount
        ) {
          throw new Error(
            `Template has too few features (${templateStructure.features?.length || 0})`
          );
        }

        // Generate sales description
        console.log(`  📝 Generating sales description...`);
        const salesDescription = await generateSalesDescription(
          templateStructure.title,
          templateStructure.features,
          opportunity.niche,
          opportunity.type
        );

        console.log(`  ✓ Sales description generated`);

        // Create product in database
        const product = await createProduct({
          opportunity_id: opportunity.id,
          niche: opportunity.niche,
          title: templateStructure.title,
          description: salesDescription,
          features: templateStructure.features,
          template_content: templateStructure,
          suggested_price: suggestedPrice,
          status: 'created',
        });

        console.log(`  ✅ Product created: ${product.id}`);
        console.log(`  💰 Suggested price: $${suggestedPrice}`);

        // Generate downloadable template files
        console.log(`  📄 Generating template files...`);
        const templateFile = saveTemplateToFile(product);
        const guideFile = generatePDFGuide(product);
        console.log(`  ✓ Template saved: ${templateFile.filename}`);
        console.log(`  ✓ Guide saved: ${guideFile.filename}`);

        // Mark opportunity as completed
        await updateOpportunityStatus(opportunity.id, 'completed');

        created.push(product);

        // Log successful creation
        await logAction('creator', 'product_created', 'success', {
          product_id: product.id,
          opportunity_id: opportunity.id,
          title: product.title,
          features_count: product.features.length,
          suggested_price: suggestedPrice,
        });
      } catch (error) {
        console.error(`  ❌ Error creating product for ${opportunity.title}:`, error.message);

        // Mark opportunity as failed
        await updateOpportunityStatus(opportunity.id, 'failed');

        await logAction('creator', 'product_creation_failed', 'error', {
          opportunity_id: opportunity.id,
          title: opportunity.title,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Creator Agent completed. Created: ${created.length} products\n`);

    // Log completion
    await logAction('creator', 'run_completed', 'success', {
      created_count: created.length,
      timestamp: new Date().toISOString(),
    });

    return {
      created: created.length,
      products: created,
    };
  } catch (error) {
    console.error('❌ Creator Agent failed:', error.message);

    await logAction('creator', 'run_failed', 'error', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Get Creator Agent status
 */
export const getCreatorStatus = async () => {
  const products = await getProducts({ status: 'created' });
  const queueFull = products.length >= CONFIG.thresholds.maxProductsInQueue;

  return {
    products_in_queue: products.length,
    max_queue_size: CONFIG.thresholds.maxProductsInQueue,
    queue_full: queueFull,
    max_creations_per_cycle: CONFIG.agents.creator.maxCreationsPerCycle,
    min_features_count: CONFIG.agents.creator.minFeaturesCount,
  };
};

// Run standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCreator()
    .then((result) => {
      console.log('Creator Agent Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Creator Agent Error:', error);
      process.exit(1);
    });
}

export default { runCreator, getCreatorStatus };
