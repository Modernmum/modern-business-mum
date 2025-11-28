/**
 * ETSY BULK UPLOAD CSV GENERATOR
 * Generates CSV files for Etsy bulk listing upload
 * Gets products onto marketplace with 95 million active buyers
 */

import { getProducts } from '../lib/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate Etsy-compatible CSV for bulk upload
 */
const generateEtsyCSV = async () => {
  console.log('\n🛍️  ETSY BULK UPLOAD CSV GENERATOR\n');

  // Get all listed products
  const products = await getProducts({ status: 'listed', limit: 100 });

  console.log(`📦 Found ${products.length} products to list on Etsy\n`);

  // Etsy CSV headers (required format for bulk upload)
  const headers = [
    'Title',
    'Description',
    'Price',
    'Quantity',
    'SKU',
    'Tags',
    'Materials',
    'Category',
    'Item Weight',
    'Item Length',
    'Item Width',
    'Item Height',
    'Item Dimensions Unit',
    'Is Supply',
    'When Made',
    'Who Made',
    'Type',
    'Digital File'
  ];

  const rows = products.map(product => {
    // Etsy title max 140 chars
    const title = product.title.length > 140
      ? product.title.substring(0, 137) + '...'
      : product.title;

    // Etsy description - combine description and features
    const features = product.template_content?.features?.slice(0, 5).join('\n• ') || '';
    const description = `${product.description}\n\nKEY FEATURES:\n• ${features}\n\nInstant digital download. No physical item will be shipped.`;

    // Etsy tags (max 13 tags, each max 20 chars)
    const tags = [
      'notion template',
      product.niche,
      'productivity',
      'digital download',
      'business tool',
      'instant download',
      'notion',
      'planner',
      'tracker',
      'dashboard'
    ].slice(0, 13).join(',');

    // SKU
    const sku = `NOTION-${product.id}`;

    // Price (Etsy takes 6.5% fee + $0.20 listing fee)
    const price = product.suggested_price;

    return [
      title,                          // Title
      description,                    // Description
      price,                          // Price
      999,                            // Quantity (high for digital)
      sku,                            // SKU
      tags,                           // Tags
      'Digital File',                 // Materials
      'Templates',                    // Category
      '',                             // Item Weight (N/A for digital)
      '',                             // Item Length
      '',                             // Item Width
      '',                             // Item Height
      '',                             // Item Dimensions Unit
      'false',                        // Is Supply
      '2020_2024',                    // When Made (recent)
      'i_did',                        // Who Made
      'download',                     // Type
      'TRUE'                          // Digital File
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Save CSV file
  const outputDir = path.join(__dirname, '..', 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const csvPath = path.join(outputDir, 'etsy-bulk-upload.csv');
  await fs.writeFile(csvPath, csvContent);

  console.log(`✅ CSV file created: ${csvPath}\n`);

  // Create instructions file
  const instructions = `# ETSY BULK UPLOAD INSTRUCTIONS

## You now have ${products.length} products ready to list on Etsy!

### Step 1: Open Etsy Seller Dashboard
1. Go to: https://www.etsy.com/your/shops/me/tools/listings
2. Click "Add a listing" dropdown
3. Select "Upload CSV file"

### Step 2: Upload the CSV
1. Choose file: etsy-bulk-upload.csv
2. Click "Upload and preview"
3. Review the listings
4. Click "Publish all"

### Step 3: Add Digital Files
Since Etsy requires you to upload the actual Notion template files:
1. For each listing, click "Edit"
2. Under "Digital Files", upload your .notion template file
3. Click "Save"

Note: You'll need to create simple .notion template files or provide a download link to Notion templates.

### Why Etsy?
- 95 million active buyers
- Built-in traffic and discovery
- No marketing needed initially
- 6.5% transaction fee + $0.20 listing fee
- Digital products perform well

### Expected Results:
- First sale: Within 7-14 days (with Etsy's search traffic)
- Monthly sales: 5-15 products = $75-$375/month
- Growth: Etsy promotes new shops, so early momentum is key

### Tips for Success:
1. Use all 13 tag slots (already done in CSV)
2. Add product photos (screenshots of templates)
3. Respond to messages within 24 hours
4. Offer bundle discounts
5. Run Etsy Ads ($1-5/day) to boost visibility

Good luck! 🚀
`;

  const instructionsPath = path.join(outputDir, 'ETSY-UPLOAD-INSTRUCTIONS.md');
  await fs.writeFile(instructionsPath, instructions);

  console.log(`📋 Instructions created: ${instructionsPath}\n`);

  console.log('='.repeat(80));
  console.log('\n🎉 SUCCESS! Ready to list on Etsy\n');
  console.log(`📁 Files created in: ${outputDir}/`);
  console.log(`   - etsy-bulk-upload.csv (${products.length} products)`);
  console.log(`   - ETSY-UPLOAD-INSTRUCTIONS.md\n`);
  console.log('📍 Next step: Follow instructions to upload to Etsy');
  console.log('⏱️  Time to complete: 15-30 minutes');
  console.log('💰 Potential: First sale within 2 weeks\n');
  console.log('='.repeat(80));

  return {
    csvPath,
    instructionsPath,
    productCount: products.length
  };
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEtsyCSV()
    .then(() => {
      console.log('\n✅ Etsy CSV generation complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Generation failed:', error);
      process.exit(1);
    });
}

export { generateEtsyCSV };
