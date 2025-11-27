/**
 * PRODUCT RESEARCH AGENT
 * Uses Perplexity AI to find trending products across multiple categories
 * Identifies: Digital products, print-on-demand designs, dropshipping items
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Query Perplexity AI for product research
 */
async function queryPerplexity(prompt) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a product research expert specializing in e-commerce trends, Etsy bestsellers, and profitable product opportunities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();

  // Check for errors
  if (data.error) {
    throw new Error(`Perplexity API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.choices || !data.choices[0]) {
    console.error('Unexpected API response:', JSON.stringify(data, null, 2));
    throw new Error('Invalid API response structure');
  }

  return data.choices[0].message.content;
}

/**
 * Research trending digital products
 */
async function researchDigitalProducts() {
  console.log('\n🔍 Researching trending digital products...\n');

  const prompt = `Find the top 10 trending digital products selling well on Etsy right now in November 2025.

For each product, provide:
1. Product name/type
2. Price range
3. Why it's trending
4. Target audience
5. Estimated monthly sales volume

Focus on:
- Printables (planners, wall art, worksheets)
- Digital templates (Notion, Canva, Google Sheets)
- Educational resources (ebooks, courses, guides)
- Design assets (fonts, graphics, patterns)

Return as a structured list with clear categories.`;

  const results = await queryPerplexity(prompt);
  return results;
}

/**
 * Research print-on-demand opportunities
 */
async function researchPrintOnDemand() {
  console.log('\n👕 Researching print-on-demand trends...\n');

  const prompt = `What are the top 10 best-selling print-on-demand product niches in November 2025?

For each niche, provide:
1. Product type (t-shirt, mug, hoodie, etc.)
2. Design theme/style
3. Target demographic
4. Average selling price
5. Competition level

Focus on products that can be automated with Printful or Printify integration.

Include trending design themes like:
- Motivational quotes
- Niche hobbies
- Pop culture references
- Seasonal trends
- Professional/career themed

Return as a structured list.`;

  const results = await queryPerplexity(prompt);
  return results;
}

/**
 * Research dropshipping products
 */
async function researchDropshipping() {
  console.log('\n📦 Researching dropshipping opportunities...\n');

  const prompt = `What are the top 10 trending dropshipping products for November 2025 with high profit margins?

For each product, provide:
1. Product name
2. Category (beauty, home, tech, fashion, etc.)
3. Supplier recommendation (AliExpress, CJ Dropshipping, etc.)
4. Cost price vs selling price
5. Why it's trending now

Focus on:
- Beauty and personal care products
- Home organization items
- Tech accessories
- Wellness products
- Pet products

Avoid oversaturated markets. Return as a structured list.`;

  const results = await queryPerplexity(prompt);
  return results;
}

/**
 * Research Etsy-specific opportunities
 */
async function researchEtsyBestsellers() {
  console.log('\n⭐ Researching Etsy bestsellers...\n');

  const prompt = `What are the top 10 best-selling product categories on Etsy right now in November 2025?

For each category, provide:
1. Category name
2. Example top products
3. Price range
4. Competition level (Low/Medium/High)
5. SEO keywords to target
6. Profit potential

Include both physical and digital products. Focus on categories with low barrier to entry for new sellers.

Return as a structured list with actionable insights.`;

  const results = await queryPerplexity(prompt);
  return results;
}

/**
 * Research PLR (Private Label Rights) products to resell
 */
async function researchPLRProducts() {
  console.log('\n📄 Researching PLR products to resell...\n');

  const prompt = `What are the best PLR (Private Label Rights) digital products to buy and resell in November 2025?

For each product type, provide:
1. Product category
2. Where to buy quality PLR
3. Average cost to acquire PLR rights
4. Selling price potential
5. How to rebrand/customize it

Focus on:
- Planners and journals
- Ebooks and guides
- Social media templates
- Business templates
- Educational content

Return recommendations with profit calculations.`;

  const results = await queryPerplexity(prompt);
  return results;
}

/**
 * Save research to database
 */
async function saveResearchToDatabase(category, findings) {
  await supabase.from('system_logs').insert({
    agent: 'Product Research',
    action: `Researched ${category}`,
    status: 'success',
    details: {
      category,
      findings: findings.substring(0, 500), // Truncate for storage
      researched_at: new Date().toISOString()
    }
  });
}

/**
 * Main research function
 */
async function runProductResearch() {
  console.log('\n🚀 PRODUCT RESEARCH AGENT STARTING...\n');
  console.log('Using Perplexity AI to find trending products across multiple categories\n');

  try {
    // Research all categories
    const digitalProducts = await researchDigitalProducts();
    console.log('📊 DIGITAL PRODUCTS:\n');
    console.log(digitalProducts);
    console.log('\n' + '='.repeat(80) + '\n');
    await delay(2000);

    const printOnDemand = await researchPrintOnDemand();
    console.log('👕 PRINT-ON-DEMAND:\n');
    console.log(printOnDemand);
    console.log('\n' + '='.repeat(80) + '\n');
    await delay(2000);

    const dropshipping = await researchDropshipping();
    console.log('📦 DROPSHIPPING:\n');
    console.log(dropshipping);
    console.log('\n' + '='.repeat(80) + '\n');
    await delay(2000);

    const etsyBestsellers = await researchEtsyBestsellers();
    console.log('⭐ ETSY BESTSELLERS:\n');
    console.log(etsyBestsellers);
    console.log('\n' + '='.repeat(80) + '\n');
    await delay(2000);

    const plrProducts = await researchPLRProducts();
    console.log('📄 PLR PRODUCTS TO RESELL:\n');
    console.log(plrProducts);
    console.log('\n' + '='.repeat(80) + '\n');

    // Save all research
    await saveResearchToDatabase('Digital Products', digitalProducts);
    await saveResearchToDatabase('Print-on-Demand', printOnDemand);
    await saveResearchToDatabase('Dropshipping', dropshipping);
    await saveResearchToDatabase('Etsy Bestsellers', etsyBestsellers);
    await saveResearchToDatabase('PLR Products', plrProducts);

    console.log('\n✅ Product research complete! All findings saved to database.\n');
    console.log('💡 Next steps:');
    console.log('   1. Review the research above');
    console.log('   2. Choose product categories to focus on');
    console.log('   3. Run Etsy listing automation');
    console.log('   4. Set up print-on-demand integration\n');

  } catch (error) {
    console.error('❌ Error during product research:', error);

    await supabase.from('system_logs').insert({
      agent: 'Product Research',
      action: 'Research failed',
      status: 'error',
      details: { error: error.message }
    });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductResearch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runProductResearch };
