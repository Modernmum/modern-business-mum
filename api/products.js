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
    // Get all listed products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'listed')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Products error:', productsError);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Get listings for each product
    const productsWithListings = await Promise.all(
      (products || []).map(async (product) => {
        const { data: listings } = await supabase
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

    res.status(200).json(productsWithListings);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
