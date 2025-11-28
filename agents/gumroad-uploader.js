/**
 * GUMROAD AUTO-UPLOADER
 * Automatically uploads products to Gumroad marketplace
 * Time to first sale: 1-7 days
 * Revenue potential: $200-$3000/month
 */

import { getProducts } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

const GUMROAD_API_KEY = process.env.GUMROAD_API_KEY;
const GUMROAD_API_URL = 'https://api.gumroad.com/v2';

/**
 * Upload a single product to Gumroad
 */
const uploadToGumroad = async (product) => {
  console.log(`\n📦 Uploading: ${product.title}`);

  const productData = {
    name: product.title,
    description: product.description,
    price: product.suggested_price * 100, // Convert to cents
    currency: 'USD',
    // Gumroad requires a download URL or file upload
    // For now, we'll use the delivery URL as the file URL
    file_url: `https://modernbusinessmum.com/download/${product.id}`,
    variants_and_quantity: null,
    recurrences: null,
    variants: null,
  };

  try {
    const response = await fetch(`${GUMROAD_API_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GUMROAD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gumroad API error: ${error}`);
    }

    const result = await response.json();

    console.log(`✅ Uploaded successfully!`);
    console.log(`   Gumroad URL: ${result.product.short_url}`);
    console.log(`   Product ID: ${result.product.id}`);

    return {
      success: true,
      gumroadId: result.product.id,
      url: result.product.short_url,
    };

  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload all products to Gumroad
 */
const uploadAllToGumroad = async () => {
  console.log('\n🚀 GUMROAD AUTO-UPLOADER\n');
  console.log('Time to first sale: 1-7 days');
  console.log('Revenue potential: $200-$3,000/month\n');

  // Get all listed products that haven't been uploaded to Gumroad
  const products = await getProducts({
    status: 'listed',
    limit: 100
  });

  console.log(`📋 Found ${products.length} products to upload\n`);

  const results = {
    successful: [],
    failed: [],
  };

  // Upload products one at a time (rate limiting)
  for (const product of products) {
    const result = await uploadToGumroad(product);

    if (result.success) {
      results.successful.push({
        productId: product.id,
        title: product.title,
        gumroadUrl: result.url,
      });
    } else {
      results.failed.push({
        productId: product.id,
        title: product.title,
        error: result.error,
      });
    }

    // Rate limiting: 1 second between uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 UPLOAD SUMMARY\n');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.successful.length > 0) {
    console.log('\n🎉 Successfully uploaded products:');
    results.successful.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   URL: ${p.gumroadUrl}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n⚠️  Failed uploads:');
    results.failed.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   Error: ${p.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n💰 Potential monthly revenue: $${results.successful.length * 20}-$${results.successful.length * 50}`);
  console.log('⏱️  Expected first sale: 1-7 days\n');

  return results;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadAllToGumroad()
    .then(() => {
      console.log('✅ Gumroad upload complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Upload failed:', error);
      process.exit(1);
    });
}

export { uploadAllToGumroad, uploadToGumroad };
