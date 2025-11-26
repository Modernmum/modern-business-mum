/**
 * PINTEREST PIN IMAGE GENERATOR API
 * Generates attractive Pinterest pin images for products
 * Vercel serverless function
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID required' });
  }

  try {
    // Get product from database
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate Pinterest pin image (1000x1500px - Pinterest optimal size)
    const width = 1000;
    const height = 1500;

    // Create gradient background based on niche
    const backgroundColor = product.niche === 'business'
      ? '#1e3a8a' // Deep blue for business
      : '#059669'; // Green for finance

    const gradientSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
      </svg>
    `;

    // Text content for the pin
    const title = product.title.length > 60
      ? product.title.substring(0, 57) + '...'
      : product.title;

    const features = product.template_content?.features?.slice(0, 3) || [];
    const featuresList = features.map(f => `✓ ${f}`).join('\n');

    const price = `$${product.suggested_price}`;
    const category = product.niche === 'business' ? 'Business' : 'Finance';

    // Create text overlay SVG
    const textSvg = `
      <svg width="${width}" height="${height}">
        <!-- Title -->
        <text x="50" y="150" font-size="72" font-weight="bold" fill="white" font-family="Arial, sans-serif">
          <tspan x="50" dy="0">${title.split(' ').slice(0, 3).join(' ')}</tspan>
          ${title.split(' ').length > 3 ? `<tspan x="50" dy="80">${title.split(' ').slice(3).join(' ')}</tspan>` : ''}
        </text>

        <!-- Subtitle -->
        <text x="50" y="350" font-size="42" fill="#fbbf24" font-family="Arial, sans-serif" font-weight="600">
          Notion Template
        </text>

        <!-- Features -->
        <text x="50" y="500" font-size="36" fill="white" font-family="Arial, sans-serif">
          ${features.map((f, i) => `<tspan x="50" dy="${i === 0 ? 0 : 50}">✓ ${f.substring(0, 35)}${f.length > 35 ? '...' : ''}</tspan>`).join('')}
        </text>

        <!-- Price Badge -->
        <rect x="50" y="1200" width="200" height="100" fill="#fbbf24" rx="15"/>
        <text x="150" y="1270" font-size="56" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="Arial, sans-serif">
          ${price}
        </text>

        <!-- Category Badge -->
        <rect x="280" y="1200" width="250" height="100" fill="rgba(255,255,255,0.2)" rx="15"/>
        <text x="405" y="1270" font-size="42" fill="white" text-anchor="middle" font-family="Arial, sans-serif">
          ${category}
        </text>

        <!-- Call to Action -->
        <text x="50" y="1420" font-size="38" fill="#fbbf24" font-family="Arial, sans-serif" font-weight="600">
          Get it now ↗
        </text>
      </svg>
    `;

    // Combine gradient background with text
    const image = await sharp(Buffer.from(gradientSvg))
      .composite([
        {
          input: Buffer.from(textSvg),
          top: 0,
          left: 0,
        }
      ])
      .png()
      .toBuffer();

    // Return image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.status(200).send(image);

  } catch (error) {
    console.error('Pin image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate pin image',
      details: error.message
    });
  }
}
