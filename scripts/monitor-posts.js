import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('\n📊 ZERO TO LEGACY ENGINE - POSTING MONITOR\n');
console.log('='.repeat(80));

async function monitorPosts() {
  try {
    // Get all listings (posts across platforms)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        *,
        products (
          title,
          niche,
          suggested_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (listingsError) throw listingsError;

    console.log(`\n🚀 RECENT POSTS (Last 20):\n`);

    if (!listings || listings.length === 0) {
      console.log('   No posts yet. Run the automation cycle to start posting!\n');
      return;
    }

    // Group by platform
    const platforms = {
      pinterest: [],
      youtube: [],
      reddit: [],
      facebook: [],
      linkedin: [],
      other: []
    };

    listings.forEach(listing => {
      const platform = listing.platform?.toLowerCase() || 'other';
      if (platforms[platform]) {
        platforms[platform].push(listing);
      } else {
        platforms.other.push(listing);
      }
    });

    // Display by platform
    for (const [platform, posts] of Object.entries(platforms)) {
      if (posts.length === 0) continue;

      const icons = {
        pinterest: '📌',
        youtube: '📺',
        reddit: '🔴',
        facebook: '👥',
        linkedin: '💼',
        other: '📝'
      };

      console.log(`\n${icons[platform]} ${platform.toUpperCase()} (${posts.length} posts):`);
      console.log('-'.repeat(80));

      posts.forEach(post => {
        const productName = post.products?.title || 'Unknown Product';
        const status = post.status || 'unknown';
        const sales = post.sales || 0;
        const revenue = post.revenue || 0;
        const createdAt = new Date(post.created_at).toLocaleString();

        const statusIcon = status === 'published' ? '✅' : status === 'failed' ? '❌' : '⏳';

        console.log(`\n   ${statusIcon} ${productName}`);
        console.log(`      Status: ${status}`);
        console.log(`      Posted: ${createdAt}`);
        if (post.url) console.log(`      URL: ${post.url}`);
        console.log(`      Sales: ${sales} | Revenue: $${revenue}`);
      });
    }

    // Summary stats
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 SUMMARY STATS:\n');

    const totalPosts = listings.length;
    const published = listings.filter(l => l.status === 'published').length;
    const failed = listings.filter(l => l.status === 'failed').length;
    const pending = listings.filter(l => l.status === 'pending' || !l.status).length;
    const totalSales = listings.reduce((sum, l) => sum + (l.sales || 0), 0);
    const totalRevenue = listings.reduce((sum, l) => sum + (parseFloat(l.revenue) || 0), 0);

    console.log(`   Total Posts: ${totalPosts}`);
    console.log(`   Published: ${published} ✅`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Pending: ${pending} ⏳`);
    console.log(`   Total Sales: ${totalSales}`);
    console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 TIP: Run this script anytime to see posting activity');
    console.log('   Command: node scripts/monitor-posts.js\n');

  } catch (error) {
    console.error('\n❌ Error monitoring posts:', error.message);
  }
}

monitorPosts();
