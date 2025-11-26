import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Fetch products with listings
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*, listings(*)')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Products error:', productsError);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Fetch opportunities count
    const { count: opportunitiesCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    // Fetch listings count
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      products: products || [],
      opportunitiesCount: opportunitiesCount || 0,
      listingsCount: listingsCount || 0
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
