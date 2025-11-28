/**
 * PUBLIC WEBSITE SERVER
 * Serves the storefront and provides API endpoints
 * Keeps database credentials secure
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getProducts, getSystemStats } from './lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PUBLIC_PORT || 3001;

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Clean URL routing - remove .html extensions
app.get('/shop', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'shop.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'services.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'privacy.html'));
});

app.get('/posts', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'posts.html'));
});

app.get('/custom-order', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'custom-order.html'));
});

// Dashboard is NOT public - it's only accessible locally for system monitoring
app.get('/dashboard', (req, res) => {
  res.sendFile(join(__dirname, 'private', 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(join(__dirname, 'private', 'dashboard.html'));
});

// API endpoint for products
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts({ status: 'listed', limit: 100 });

    // Get listings for each product
    const productsWithListings = await Promise.all(
      products.map(async (product) => {
        const { data: listings } = await (await import('./lib/database.js')).supabase
          .from('listings')
          .select('*')
          .eq('product_id', product.id)
          .eq('status', 'published');

        return {
          ...product,
          listings: listings || []
        };
      })
    );

    res.json(productsWithListings);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// API endpoint for stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// API endpoint for comprehensive dashboard data
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const { supabase } = await import('./lib/database.js');

    // Fetch all data in parallel
    const [
      { data: opportunities },
      { data: products },
      { data: listings },
      { data: sales },
      { data: logs }
    ] = await Promise.all([
      supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50)
    ]);

    // Calculate stats
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
    const totalSales = sales?.length || 0;

    // Group products by status
    const productsByStatus = {};
    products?.forEach(p => {
      productsByStatus[p.status] = (productsByStatus[p.status] || 0) + 1;
    });

    // Group listings by platform
    const listingsByPlatform = {};
    listings?.forEach(l => {
      listingsByPlatform[l.platform] = (listingsByPlatform[l.platform] || 0) + 1;
    });

    res.json({
      stats: {
        opportunities: opportunities?.length || 0,
        products: products?.length || 0,
        listings: listings?.length || 0,
        sales: totalSales,
        revenue: totalRevenue
      },
      opportunities: opportunities?.slice(0, 20) || [],
      products: products?.slice(0, 20) || [],
      listings: listings?.slice(0, 20) || [],
      sales: sales || [],
      logs: logs || [],
      breakdown: {
        productsByStatus,
        listingsByPlatform
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🌐 Public Website Server Running`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/products`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`\n✅ Storefront is live!\n`);
});
