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

    // Fetch Fiverr messages
    const { data: fiverrMessages, count: fiverrCount } = await supabase
      .from('fiverr_messages')
      .select('*', { count: 'exact' })
      .order('responded_at', { ascending: false })
      .limit(10);

    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_at', { ascending: false })
      .limit(10);

    // Fetch system logs for automation status
    const { data: recentLogs } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate revenue totals
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount');

    const totalRevenue = allTransactions?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;

    res.status(200).json({
      products: products || [],
      opportunitiesCount: opportunitiesCount || 0,
      listingsCount: listingsCount || 0,
      fiverrMessages: fiverrMessages || [],
      fiverrCount: fiverrCount || 0,
      transactions: transactions || [],
      totalRevenue: totalRevenue,
      recentLogs: recentLogs || []
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
