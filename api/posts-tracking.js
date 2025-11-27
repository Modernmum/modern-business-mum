import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get all listings with product details
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        products (
          title,
          niche,
          suggested_price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Listings error:', error);
      return res.status(500).json({ error: 'Failed to fetch listings' });
    }

    // Group by platform
    const platforms = {
      pinterest: [],
      youtube: [],
      reddit: [],
      facebook: [],
      linkedin: [],
      stripe: [],
      other: []
    };

    (listings || []).forEach(listing => {
      const platform = listing.platform?.toLowerCase() || 'other';
      if (platforms[platform]) {
        platforms[platform].push(listing);
      } else {
        platforms.other.push(listing);
      }
    });

    // Calculate summary stats
    const totalPosts = listings?.length || 0;
    const published = listings?.filter(l => l.status === 'published').length || 0;
    const failed = listings?.filter(l => l.status === 'failed').length || 0;
    const pending = listings?.filter(l => !l.status || l.status === 'pending').length || 0;
    const totalSales = listings?.reduce((sum, l) => sum + (l.sales || 0), 0) || 0;
    const totalRevenue = listings?.reduce((sum, l) => sum + (parseFloat(l.revenue) || 0), 0) || 0;

    res.status(200).json({
      platforms,
      summary: {
        totalPosts,
        published,
        failed,
        pending,
        totalSales,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Posts tracking API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
