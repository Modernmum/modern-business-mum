/**
 * RAPID MVP BUILDER
 * Builds MVPs in 48 hours from opportunities
 *
 * Product Types:
 * - Notion Templates
 * - AI Agents
 * - Info Products (courses, guides)
 * - Micro-SaaS tools
 *
 * Goal: Speed to market (48 hours)
 * Budget: $1k per MVP max
 */

import { createClient } from '@supabase/supabase-js';
import { generateText } from '../lib/ai.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

class RapidMVPBuilder {
  constructor() {
    this.buildTypes = {
      notion_template: this.buildNotionTemplate.bind(this),
      ai_agent: this.buildAIAgent.bind(this),
      info_product: this.buildInfoProduct.bind(this),
      micro_saas: this.buildMicroSaaS.bind(this),
    };

    console.log('🏗️  Rapid MVP Builder Initialized');
    console.log('Build Types:', Object.keys(this.buildTypes));
  }

  /**
   * BUILD MVP FROM OPPORTUNITY
   * Main entry point
   */
  async buildFromOpportunity(opportunityId) {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 BUILDING MVP');
    console.log('='.repeat(80));
    console.log(`Started: ${new Date().toLocaleString()}\n`);

    // Get opportunity from database
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      console.error('❌ Opportunity not found');
      return null;
    }

    console.log(`📋 Opportunity: ${opportunity.title}`);
    console.log(`🎯 Product Type: ${opportunity.product_type}`);
    console.log(`⏱️  Speed to Market: ${opportunity.speed_to_market} days\n`);

    // Get build function
    const buildFunction = this.buildTypes[opportunity.product_type];

    if (!buildFunction) {
      console.error(`❌ Unknown product type: ${opportunity.product_type}`);
      return null;
    }

    // Build the MVP
    const mvp = await buildFunction(opportunity);

    // Store in database
    await this.storeMVP(opportunity, mvp);

    // Generate launch plan
    await this.generateLaunchPlan(mvp);

    console.log(`\n✅ MVP built successfully: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');

    return mvp;
  }

  /**
   * BUILD NOTION TEMPLATE
   * Fastest to market (24-48 hours)
   */
  async buildNotionTemplate(opportunity) {
    console.log('📝 Building Notion Template...\n');

    const description = JSON.parse(opportunity.description);

    // Step 1: Generate template structure
    console.log('Step 1: Generating template structure...');
    const structure = await generateText(`
Create a comprehensive Notion template for: ${opportunity.title}

Problem it solves: ${description.problem || description.title}
Target audience: ${description.niche || 'entrepreneurs'}

Generate a detailed template structure with:
1. Database schemas (what databases are needed)
2. Page hierarchy (how pages are organized)
3. Properties and formulas (what calculations/tracking)
4. Views (kanban, calendar, gallery, etc.)
5. Automation ideas (buttons, formulas, relations)

Make it valuable enough to charge $${opportunity.revenue_potential || 29}.

Output as JSON:
{
  "template_name": "...",
  "databases": [...],
  "pages": [...],
  "key_features": [...],
  "setup_instructions": "..."
}
`, 'json');

    console.log(`  ✅ Structure generated: ${structure.databases.length} databases, ${structure.pages.length} pages\n`);

    // Step 2: Generate landing page copy
    console.log('Step 2: Generating landing page...');
    const landingPage = await generateText(`
Create a high-converting landing page for this Notion template:

Template: ${structure.template_name}
Problem: ${description.problem || opportunity.title}
Features: ${structure.key_features.join(', ')}
Price: $${opportunity.revenue_potential || 29}

Generate:
1. Headline (benefit-driven)
2. Subheadline (what it is)
3. Pain points (3 bullets)
4. Solution (how template solves it)
5. Features (5 key features)
6. Social proof placeholder
7. CTA (call to action)
8. FAQ (5 questions)

Output as HTML with Tailwind CSS classes.
`, 'text');

    console.log('  ✅ Landing page generated\n');

    // Step 3: Create product files
    console.log('Step 3: Creating product files...');

    const productSlug = opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const productDir = `/Users/Kristi/Documents/zero-to-legacy-engine/public/products/${productSlug}`;

    try {
      await fs.mkdir(productDir, { recursive: true });

      // Save landing page
      await fs.writeFile(
        `${productDir}/index.html`,
        this.wrapHTML(landingPage, structure.template_name)
      );

      // Save template instructions
      await fs.writeFile(
        `${productDir}/template-structure.json`,
        JSON.stringify(structure, null, 2)
      );

      // Save setup guide
      const setupGuide = await this.generateSetupGuide(structure);
      await fs.writeFile(
        `${productDir}/setup-guide.md`,
        setupGuide
      );

      console.log(`  ✅ Files created in ${productDir}\n`);

    } catch (error) {
      console.error('  ❌ Error creating files:', error.message);
    }

    // Step 4: Generate pricing strategy
    console.log('Step 4: Setting price...');
    const pricing = {
      base: opportunity.revenue_potential || 29,
      tiers: [
        { name: 'Starter', price: opportunity.revenue_potential || 29, features: 'Basic template' },
        { name: 'Pro', price: (opportunity.revenue_potential || 29) * 2, features: 'Template + updates' },
        { name: 'Business', price: (opportunity.revenue_potential || 29) * 5, features: 'Template + updates + support' }
      ]
    };

    console.log(`  ✅ Price set: $${pricing.base} (base)\n`);

    return {
      type: 'notion_template',
      name: structure.template_name,
      slug: productSlug,
      description: opportunity.title,
      structure: structure,
      landingPageUrl: `/products/${productSlug}/index.html`,
      pricing: pricing,
      filesCreated: [
        `${productDir}/index.html`,
        `${productDir}/template-structure.json`,
        `${productDir}/setup-guide.md`
      ],
      buildCost: 0, // Just AI time
      status: 'built'
    };
  }

  /**
   * BUILD AI AGENT
   * Medium complexity (48-72 hours)
   */
  async buildAIAgent(opportunity) {
    console.log('🤖 Building AI Agent...\n');

    const description = JSON.parse(opportunity.description);

    // Step 1: Generate agent specification
    console.log('Step 1: Designing agent...');
    const spec = await generateText(`
Design an AI agent for: ${opportunity.title}

Problem: ${description.problem || opportunity.title}
Use case: ${description.description || description.title}

Create detailed specification:
1. Agent purpose (what it does)
2. Required APIs (what services it needs)
3. Core functions (main capabilities)
4. User interface (how users interact)
5. Pricing model (subscription vs usage)

Output as JSON.
`, 'json');

    console.log(`  ✅ Agent designed: ${spec.core_functions.length} functions\n`);

    // Step 2: Generate agent code
    console.log('Step 2: Writing agent code...');
    const agentCode = await generateText(`
Write a complete JavaScript AI agent implementation:

Specification: ${JSON.stringify(spec)}

Requirements:
- Use Claude API (Anthropic)
- Use Supabase for storage
- Include error handling
- Include rate limiting
- Follow best practices

Generate complete, working code.
Output just the code, no explanations.
`, 'text');

    console.log('  ✅ Code generated\n');

    // Step 3: Create agent files
    console.log('Step 3: Creating agent files...');

    const agentSlug = opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const agentDir = `/Users/Kristi/Documents/zero-to-legacy-engine/agents/${agentSlug}`;

    try {
      await fs.mkdir(agentDir, { recursive: true });

      // Save agent code
      await fs.writeFile(
        `${agentDir}/index.js`,
        agentCode
      );

      // Save specification
      await fs.writeFile(
        `${agentDir}/spec.json`,
        JSON.stringify(spec, null, 2)
      );

      // Generate README
      const readme = await this.generateAgentREADME(spec);
      await fs.writeFile(
        `${agentDir}/README.md`,
        readme
      );

      console.log(`  ✅ Agent created in ${agentDir}\n`);

    } catch (error) {
      console.error('  ❌ Error creating agent:', error.message);
    }

    return {
      type: 'ai_agent',
      name: spec.name || opportunity.title,
      slug: agentSlug,
      description: spec.purpose,
      specification: spec,
      agentPath: `${agentDir}/index.js`,
      pricing: spec.pricing_model,
      filesCreated: [
        `${agentDir}/index.js`,
        `${agentDir}/spec.json`,
        `${agentDir}/README.md`
      ],
      buildCost: 100, // Estimated API costs for development
      status: 'built'
    };
  }

  /**
   * BUILD INFO PRODUCT
   * Fast to market (24-48 hours)
   */
  async buildInfoProduct(opportunity) {
    console.log('📚 Building Info Product...\n');

    const description = JSON.parse(opportunity.description);

    // Generate comprehensive guide/course
    console.log('Step 1: Creating content outline...');
    const outline = await generateText(`
Create a comprehensive course/guide outline for: ${opportunity.title}

Topic: ${description.problem || opportunity.title}
Target audience: ${description.niche || 'entrepreneurs'}
Value: Teach them how to solve ${description.problem}

Generate detailed outline with:
1. Course name
2. 5-10 modules
3. Each module has 3-5 lessons
4. Each lesson has key takeaways

Make it worth $${opportunity.revenue_potential || 97}.

Output as JSON.
`, 'json');

    console.log(`  ✅ Outline created: ${outline.modules.length} modules\n`);

    // Generate first module content (to prove value)
    console.log('Step 2: Generating sample content...');
    const firstModule = await generateText(`
Write complete content for Module 1: ${outline.modules[0].title}

Lessons: ${JSON.stringify(outline.modules[0].lessons)}

Make it detailed, actionable, and valuable.
Include examples, templates, and step-by-step instructions.

Output as Markdown.
`, 'text');

    console.log('  ✅ Sample module written\n');

    const productSlug = opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return {
      type: 'info_product',
      name: outline.course_name,
      slug: productSlug,
      description: opportunity.title,
      outline: outline,
      sampleContent: firstModule,
      pricing: {
        base: opportunity.revenue_potential || 97,
        tiers: [
          { name: 'Course Only', price: opportunity.revenue_potential || 97 },
          { name: 'Course + Templates', price: (opportunity.revenue_potential || 97) * 1.5 },
          { name: 'Course + Coaching', price: (opportunity.revenue_potential || 97) * 3 }
        ]
      },
      buildCost: 50, // AI generation costs
      status: 'built'
    };
  }

  /**
   * BUILD MICRO-SAAS
   * Longer build (72-96 hours)
   */
  async buildMicroSaaS(opportunity) {
    console.log('⚡ Building Micro-SaaS...\n');

    console.log('  ⚠️  Micro-SaaS builds take 3-4 days');
    console.log('  📋 Creating specification and MVP plan...\n');

    // For now, just create the specification
    // Full build would happen over 3-4 days

    const description = JSON.parse(opportunity.description);

    const spec = await generateText(`
Design a micro-SaaS product for: ${opportunity.title}

Problem: ${description.problem || opportunity.title}
Market: ${description.niche || 'small businesses'}

Create technical specification:
1. Core features (what it does)
2. Tech stack (what to build with)
3. Database schema (what data)
4. API endpoints (what endpoints)
5. UI screens (what pages)
6. Integration needs (what services)
7. Pricing tiers

Output as JSON.
`, 'json');

    console.log(`  ✅ Specification created\n`);

    return {
      type: 'micro_saas',
      name: spec.product_name || opportunity.title,
      slug: opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: spec.description,
      specification: spec,
      pricing: spec.pricing_tiers,
      buildCost: 1000, // Estimated full build cost
      status: 'spec_only', // Not fully built yet
      estimatedBuildTime: '72-96 hours'
    };
  }

  /**
   * HELPER: Wrap HTML in template
   */
  wrapHTML(content, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  ${content}
</body>
</html>`;
  }

  /**
   * HELPER: Generate setup guide
   */
  async generateSetupGuide(structure) {
    return `# ${structure.template_name} - Setup Guide

## What You Get

${structure.key_features.map(f => `- ${f}`).join('\n')}

## Setup Instructions

${structure.setup_instructions}

## Databases Included

${structure.databases.map((db, i) => `${i + 1}. ${db.name || db}`).join('\n')}

## How to Use

1. Duplicate this template to your Notion workspace
2. Follow the setup instructions above
3. Customize to your needs
4. Start using immediately

## Support

Questions? Email: support@modernbusinessmum.com
`;
  }

  /**
   * HELPER: Generate agent README
   */
  async generateAgentREADME(spec) {
    return `# ${spec.name || 'AI Agent'}

## Overview

${spec.purpose}

## Features

${spec.core_functions.map(f => `- ${f}`).join('\n')}

## Setup

\`\`\`bash
npm install
node index.js
\`\`\`

## Configuration

Required environment variables:
${spec.required_apis.map(api => `- ${api}_API_KEY`).join('\n')}

## Usage

[Add usage instructions]

## Pricing

${JSON.stringify(spec.pricing_model, null, 2)}
`;
  }

  /**
   * STORE MVP IN DATABASE
   */
  async storeMVP(opportunity, mvp) {
    console.log('💾 Storing MVP in database...');

    try {
      const { data, error } = await supabase.from('mvp_builds').insert({
        opportunity_id: opportunity.id,
        product_name: mvp.name,
        product_type: mvp.type,
        build_cost: mvp.buildCost || 0,
        launch_date: new Date().toISOString().split('T')[0],
        landing_page_url: mvp.landingPageUrl || null,
        status: 'testing',
        created_at: new Date().toISOString()
      }).select().single();

      if (error) {
        console.error('  ❌ Database error:', error.message);
      } else {
        console.log(`  ✅ MVP stored (ID: ${data.id})\n`);
      }

      // Update opportunity status
      await supabase
        .from('opportunities')
        .update({ status: 'launched', launched_at: new Date().toISOString() })
        .eq('id', opportunity.id);

    } catch (error) {
      console.error('  ❌ Storage error:', error.message);
    }
  }

  /**
   * GENERATE LAUNCH PLAN
   */
  async generateLaunchPlan(mvp) {
    console.log('🚀 Generating launch plan...\n');

    const plan = await generateText(`
Create a 7-day launch plan for this MVP:

Product: ${mvp.name}
Type: ${mvp.type}
Price: $${mvp.pricing.base || mvp.pricing[0]?.price}

Generate:
1. Day 1-2: Pre-launch (build buzz)
2. Day 3-5: Launch (get first customers)
3. Day 6-7: Post-launch (optimize)

Include specific tactics for each day.
Output as Markdown.
`, 'text');

    console.log(plan);
    console.log('');

    return plan;
  }
}

/**
 * BUILD MVP FROM COMMAND LINE
 */
const buildMVP = async () => {
  const builder = new RapidMVPBuilder();

  // Get opportunity ID from command line
  const opportunityId = process.argv[2];

  if (!opportunityId) {
    console.error('❌ Usage: node rapid-mvp-builder.js <opportunity-id>');
    process.exit(1);
  }

  await builder.buildFromOpportunity(opportunityId);
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildMVP().catch(error => {
    console.error('\n❌ Build error:', error);
    process.exit(1);
  });
}

export { RapidMVPBuilder };
