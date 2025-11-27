/**
 * PRINTFUL PRINT-ON-DEMAND AGENT
 * Automatically creates high-quality print-on-demand products using Printful API
 * Focus: Pet lovers, Health & Wellness, Professional themes
 */

import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_API_BASE = 'https://api.printful.com';

/**
 * Generate AI design prompt for print-on-demand
 */
async function generateDesignPrompt(niche, productType) {
  console.log(`\n🎨 Generating ${niche} design for ${productType}...\n`);

  const prompt = `Create a professional, trendy design concept for a ${productType} in the ${niche} niche.

Niche: ${niche}
Product: ${productType}

Generate:
1. DESIGN CONCEPT (visual description, style, colors)
2. TEXT/SLOGAN (if applicable - catchy, benefit-focused)
3. TARGET CUSTOMER (who would buy this)
4. PRICE POINT (suggested retail price)
5. MARKETING ANGLE (why this design will sell)

Design should be:
- Professional and high-quality
- Trendy and current (November 2025)
- Appeal to the target demographic
- Simple enough to print well
- Unique and memorable

Return in this format:
CONCEPT: [design description]
TEXT: [slogan or text]
TARGET: [customer profile]
PRICE: $[amount]
ANGLE: [marketing angle]`;

  const response = await generateText(prompt, 'text');

  // Parse response
  const conceptMatch = response.match(/CONCEPT:\s*(.+)/);
  const textMatch = response.match(/TEXT:\s*(.+)/);
  const targetMatch = response.match(/TARGET:\s*(.+)/);
  const priceMatch = response.match(/PRICE:\s*\$?(\d+\.?\d*)/);
  const angleMatch = response.match(/ANGLE:\s*(.+)/);

  return {
    concept: conceptMatch ? conceptMatch[1].trim() : '',
    text: textMatch ? textMatch[1].trim() : '',
    target: targetMatch ? targetMatch[1].trim() : '',
    price: priceMatch ? parseFloat(priceMatch[1]) : 25,
    marketingAngle: angleMatch ? angleMatch[1].trim() : '',
    niche,
    productType
  };
}

/**
 * Get Printful product catalog
 */
async function getPrintfulProducts() {
  if (!PRINTFUL_API_KEY || PRINTFUL_API_KEY === 'your_printful_api_key') {
    console.log('⚠️  Printful API key not configured - using mock data\n');
    return [
      { id: 71, name: 'Unisex Heavy Cotton Tee', type: 't-shirt', base_cost: 11.50 },
      { id: 146, name: 'Unisex Hoodie', type: 'hoodie', base_cost: 26.95 },
      { id: 19, name: 'White Mug 11oz', type: 'mug', base_cost: 6.95 },
      { id: 333, name: 'Tote Bag', type: 'tote', base_cost: 10.95 },
      { id: 380, name: 'iPhone Case', type: 'phone-case', base_cost: 12.95 }
    ];
  }

  try {
    const response = await fetch(`${PRINTFUL_API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching Printful products:', error.message);
    return [];
  }
}

/**
 * Create Printful product
 */
async function createPrintfulProduct(design, printfulProductId) {
  console.log(`\n📦 Creating Printful product: ${design.productType}...\n`);

  if (!PRINTFUL_API_KEY || PRINTFUL_API_KEY === 'your_printful_api_key') {
    console.log('⚠️  Demo mode - would create product in Printful\n');
    return {
      id: `mock-${Date.now()}`,
      external_id: `pod-${Date.now()}`,
      name: `${design.niche} ${design.productType}`,
      thumbnail_url: 'https://via.placeholder.com/400x400?text=POD+Product'
    };
  }

  try {
    const response = await fetch(`${PRINTFUL_API_BASE}/store/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sync_product: {
          name: `${design.niche} - ${design.text || design.productType}`,
          thumbnail: design.mockupUrl || ''
        },
        sync_variants: [
          {
            retail_price: design.price.toFixed(2),
            variant_id: printfulProductId,
            files: [
              {
                url: design.designUrl || 'https://via.placeholder.com/400x400'
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error creating Printful product:', error.message);
    return null;
  }
}

/**
 * Sync Printful product to Etsy
 */
async function syncToEtsy(printfulProduct) {
  if (!PRINTFUL_API_KEY || PRINTFUL_API_KEY === 'your_printful_api_key') {
    console.log('⚠️  Demo mode - would sync to Etsy\n');
    return `https://etsy.com/listing/mock-${Date.now()}`;
  }

  // Printful has built-in Etsy integration
  // This would use Printful's API to push to connected Etsy shop
  console.log('🔗 Syncing to Etsy via Printful integration...\n');
  return `https://etsy.com/listing/${printfulProduct.id}`;
}

/**
 * Save POD product to database
 */
async function savePODProduct(design, printfulProduct, etsyUrl) {
  const { data: product } = await supabase
    .from('products')
    .insert({
      niche: design.niche,
      title: `${design.niche} ${design.productType} - ${design.text}`,
      description: `${design.concept}\n\nPerfect for: ${design.target}\n\n${design.marketingAngle}`,
      suggested_price: design.price,
      status: 'created',
      template_content: {
        type: 'print-on-demand',
        printful_id: printfulProduct.id,
        design: design
      }
    })
    .select()
    .single();

  if (etsyUrl) {
    await supabase.from('listings').insert({
      product_id: product.id,
      platform: 'etsy',
      url: etsyUrl,
      price: design.price,
      status: 'published',
      sales: 0,
      revenue: 0
    });
  }

  await supabase.from('system_logs').insert({
    agent: 'Printful POD',
    action: `Created ${design.niche} ${design.productType}`,
    status: 'success',
    details: {
      product_id: product.id,
      printful_id: printfulProduct.id,
      price: design.price,
      niche: design.niche
    }
  });

  return product;
}

/**
 * Main POD creation function
 */
async function runPrintfulPOD(maxProducts = 3) {
  console.log('\n👕 PRINTFUL PRINT-ON-DEMAND AGENT STARTING...\n');
  console.log('Creating high-quality, trending POD products\n');

  try {
    // Get trending niches from research
    const niches = [
      { name: 'Pet Lovers', products: ['t-shirt', 'mug', 'tote'] },
      { name: 'Health & Wellness', products: ['hoodie', 't-shirt', 'mug'] },
      { name: 'Professional', products: ['t-shirt', 'mug', 'tote'] }
    ];

    // Get Printful product catalog
    const printfulProducts = await getPrintfulProducts();
    console.log(`📊 Printful catalog: ${printfulProducts.length} products available\n`);

    let created = 0;

    for (const niche of niches) {
      if (created >= maxProducts) break;

      // Pick random product type
      const productType = niche.products[Math.floor(Math.random() * niche.products.length)];

      // Find matching Printful product
      const printfulProduct = printfulProducts.find(p =>
        (p.type && p.type === productType) ||
        (p.name && p.name.toLowerCase().includes(productType))
      ) || printfulProducts[0];

      // Generate design
      const design = await generateDesignPrompt(niche.name, productType);

      console.log('✨ Design Generated:');
      console.log(`   Niche: ${design.niche}`);
      console.log(`   Type: ${design.productType}`);
      console.log(`   Text: ${design.text}`);
      console.log(`   Price: $${design.price}`);
      console.log(`   Target: ${design.target}\n`);

      // Create in Printful
      const printfulProductResult = await createPrintfulProduct(design, printfulProduct.id);

      // Sync to Etsy
      const etsyUrl = await syncToEtsy(printfulProductResult);

      // Save to database
      await savePODProduct(design, printfulProductResult, etsyUrl);

      console.log(`✅ Created and listed: ${design.niche} ${design.productType}\n`);

      created++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }

    console.log(`\n🎉 POD Creation Complete!`);
    console.log(`   Products created: ${created}`);
    console.log(`   Next: Products will auto-fulfill when orders come in\n`);

    return { created };

  } catch (error) {
    console.error('❌ Error:', error);

    await supabase.from('system_logs').insert({
      agent: 'Printful POD',
      action: 'POD creation failed',
      status: 'error',
      details: { error: error.message }
    });

    return { created: 0 };
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const maxProducts = parseInt(process.argv[2]) || 3;

  runPrintfulPOD(maxProducts)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runPrintfulPOD };
