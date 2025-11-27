/**
 * FIX PRODUCT DESCRIPTIONS
 * Removes "HOOK:", "BENEFITS:", etc. labels from product descriptions
 */

import { createClient } from '@supabase/supabase-js';
import { generateText } from '../lib/ai.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const cleanDescription = async (rawDescription, title) => {
  const prompt = `You are a professional copywriter. Clean up this product description by removing all template labels like "HOOK:", "SOLUTION:", "BENEFITS:", "FEATURES:", "CALL TO ACTION:".

Convert it into a flowing, natural product description that sounds professional and compelling - like something you'd see on a real e-commerce site.

Product: ${title}

Raw description:
${rawDescription}

Return ONLY the cleaned description with no labels - just natural, flowing copy that sells the product.`;

  const cleaned = await generateText(prompt, 'text');
  return cleaned;
};

const fixAllProducts = async () => {
  console.log('🔧 Fixing product descriptions...\n');

  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products to fix\n`);

  let fixed = 0;
  let skipped = 0;

  for (const product of products) {
    // Check if description has template labels
    if (product.description?.includes('HOOK:') ||
        product.description?.includes('BENEFITS:') ||
        product.description?.includes('CALL TO ACTION:')) {

      console.log(`Fixing: ${product.title}`);

      const cleanedDescription = await cleanDescription(product.description, product.title);

      // Update in database
      const { error: updateError } = await supabase
        .from('products')
        .update({ description: cleanedDescription })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Error updating ${product.title}:`, updateError);
      } else {
        console.log(`  ✅ Fixed\n`);
        fixed++;
      }

      // Small delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`Skipping (already clean): ${product.title}`);
      skipped++;
    }
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Fixed: ${fixed} products`);
  console.log(`   Skipped: ${skipped} products`);
};

fixAllProducts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
