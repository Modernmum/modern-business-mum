/**
 * OPPORTUNITY SCANNER
 * Autonomous market scanning for empire building
 *
 * Runs 24/7 scanning for:
 * - Unmet market needs
 * - Micro-market gaps
 * - Fast-to-market opportunities
 * - High ROI potential
 *
 * Output: Daily ranked list of opportunities
 */

import { createClient } from '@supabase/supabase-js';
import { generateText } from '../lib/ai.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

class OpportunityScanner {
  constructor() {
    this.sources = {
      reddit: true,
      twitter: false, // Disabled until tokens work
      googleTrends: true,
      productHunt: true,
      indieHackers: true,
      microAcquire: true,
    };

    console.log('🔍 Opportunity Scanner Initialized');
    console.log('Active Sources:', Object.keys(this.sources).filter(k => this.sources[k]));
  }

  /**
   * MAIN SCAN LOOP
   * Runs continuously, scanning all sources
   */
  async scanContinuously() {
    console.log('\n🚀 Starting continuous opportunity scan...\n');

    while (true) {
      try {
        await this.runScanCycle();

        // Wait 6 hours between full scans
        const sixHours = 6 * 60 * 60 * 1000;
        console.log(`\n⏰ Next scan in 6 hours...\n`);
        await new Promise(resolve => setTimeout(resolve, sixHours));

      } catch (error) {
        console.error('❌ Scan cycle error:', error.message);
        // Wait 1 hour on error, then retry
        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
      }
    }
  }

  /**
   * RUN SINGLE SCAN CYCLE
   * Scans all sources, analyzes, ranks, stores
   */
  async runScanCycle() {
    console.log('='.repeat(80));
    console.log('🔍 OPPORTUNITY SCAN CYCLE');
    console.log('='.repeat(80));
    console.log(`Started: ${new Date().toLocaleString()}\n`);

    // Scan all sources in parallel
    const signals = await Promise.all([
      this.scanReddit(),
      this.scanGoogleTrends(),
      this.scanProductHunt(),
      this.scanIndieHackers(),
      this.scanMicroAcquire(),
    ]);

    // Flatten and filter
    const allOpportunities = signals.flat().filter(opp => opp !== null);

    console.log(`\n📊 Found ${allOpportunities.length} raw opportunities\n`);

    // Analyze with AI
    const analyzed = await this.analyzeOpportunities(allOpportunities);

    // Rank by potential
    const ranked = analyzed.sort((a, b) => b.score - a.score);

    // Store top 50
    await this.storeOpportunities(ranked.slice(0, 50));

    // Generate daily report
    await this.generateReport(ranked.slice(0, 10));

    console.log(`\n✅ Scan cycle complete: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');

    return ranked.slice(0, 10);
  }

  /**
   * SCAN REDDIT
   * Look for pain points in entrepreneurship subreddits
   */
  async scanReddit() {
    console.log('🔴 Scanning Reddit...');

    const subreddits = [
      'entrepreneur',
      'smallbusiness',
      'SaaS',
      'startups',
      'Notion',
      'productivity',
      'ecommerce',
      'amazon',
      'shopify'
    ];

    const opportunities = [];

    for (const subreddit of subreddits) {
      try {
        // Fetch top posts from last week
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=25`,
          { headers: { 'User-Agent': 'OpportunityScanner/1.0' } }
        );

        const posts = response.data.data.children;

        // Look for pain points (questions, complaints, requests)
        const painPoints = posts.filter(post => {
          const title = post.data.title.toLowerCase();
          return (
            title.includes('how do i') ||
            title.includes('looking for') ||
            title.includes('need help') ||
            title.includes('struggling with') ||
            title.includes('any tools for') ||
            title.includes('recommendation')
          );
        });

        for (const post of painPoints) {
          opportunities.push({
            source: 'reddit',
            subreddit: subreddit,
            title: post.data.title,
            description: post.data.selftext,
            upvotes: post.data.ups,
            comments: post.data.num_comments,
            url: `https://reddit.com${post.data.permalink}`,
            timestamp: new Date(post.data.created_utc * 1000)
          });
        }

      } catch (error) {
        console.error(`  ❌ Error scanning r/${subreddit}:`, error.message);
      }
    }

    console.log(`  ✅ Found ${opportunities.length} Reddit pain points`);
    return opportunities;
  }

  /**
   * SCAN GOOGLE TRENDS
   * Find rising search queries
   */
  async scanGoogleTrends() {
    console.log('📈 Scanning Google Trends...');

    // Use Perplexity to analyze Google Trends
    const prompt = `Search Google Trends and find:

1. Rising searches in business/productivity space
2. Breakout searches (500%+ growth)
3. Related to: notion, templates, AI, automation, small business

Return JSON array of opportunities with:
{
  "query": "search term",
  "growth": "percentage",
  "volume": "search volume estimate",
  "category": "category"
}`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const trends = JSON.parse(response.data.choices[0].message.content);

      const opportunities = trends.map(trend => ({
        source: 'google_trends',
        query: trend.query,
        growth: trend.growth,
        volume: trend.volume,
        category: trend.category,
        timestamp: new Date()
      }));

      console.log(`  ✅ Found ${opportunities.length} trending searches`);
      return opportunities;

    } catch (error) {
      console.error('  ❌ Error scanning Google Trends:', error.message);
      return [];
    }
  }

  /**
   * SCAN PRODUCT HUNT
   * See what's launching and what problems they solve
   */
  async scanProductHunt() {
    console.log('🔥 Scanning Product Hunt...');

    // Use Perplexity to scrape Product Hunt
    const prompt = `Search Product Hunt for products launched this week.

Find products related to:
- Notion templates
- AI automation
- Productivity tools
- Small business tools

Return JSON array with:
{
  "name": "product name",
  "tagline": "one-liner",
  "problem": "what problem it solves",
  "upvotes": "number",
  "url": "product hunt url"
}`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const products = JSON.parse(response.data.choices[0].message.content);

      const opportunities = products.map(product => ({
        source: 'product_hunt',
        name: product.name,
        tagline: product.tagline,
        problem: product.problem,
        upvotes: product.upvotes,
        url: product.url,
        timestamp: new Date()
      }));

      console.log(`  ✅ Found ${opportunities.length} Product Hunt launches`);
      return opportunities;

    } catch (error) {
      console.error('  ❌ Error scanning Product Hunt:', error.message);
      return [];
    }
  }

  /**
   * SCAN INDIE HACKERS
   * See what indie makers are building and earning
   */
  async scanIndieHackers() {
    console.log('💼 Scanning Indie Hackers...');

    // Use Perplexity to scrape Indie Hackers
    const prompt = `Search Indie Hackers for recent posts about:
- Micro SaaS ideas
- Revenue milestones
- Problems makers are solving
- Successful niches

Return JSON array with:
{
  "title": "post title",
  "revenue": "monthly revenue if mentioned",
  "problem": "what problem they're solving",
  "niche": "target market"
}`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const posts = JSON.parse(response.data.choices[0].message.content);

      const opportunities = posts.map(post => ({
        source: 'indie_hackers',
        title: post.title,
        revenue: post.revenue,
        problem: post.problem,
        niche: post.niche,
        timestamp: new Date()
      }));

      console.log(`  ✅ Found ${opportunities.length} Indie Hackers insights`);
      return opportunities;

    } catch (error) {
      console.error('  ❌ Error scanning Indie Hackers:', error.message);
      return [];
    }
  }

  /**
   * SCAN MICROACQUIRE
   * Find profitable businesses for sale
   */
  async scanMicroAcquire() {
    console.log('💰 Scanning MicroAcquire...');

    // Use Perplexity to scrape MicroAcquire listings
    const prompt = `Search MicroAcquire, Flippa, and Empire Flippers for:
- Profitable businesses for sale
- Asking price $10k-$100k
- Positive EBITDA
- SaaS or content sites preferred

Return JSON array with:
{
  "name": "business name",
  "price": "asking price",
  "revenue": "monthly revenue",
  "profit": "monthly profit",
  "multiple": "price/annual profit",
  "url": "listing url"
}`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const listings = JSON.parse(response.data.choices[0].message.content);

      const opportunities = listings.map(listing => ({
        source: 'micro_acquire',
        name: listing.name,
        price: listing.price,
        revenue: listing.revenue,
        profit: listing.profit,
        multiple: listing.multiple,
        url: listing.url,
        timestamp: new Date()
      }));

      console.log(`  ✅ Found ${opportunities.length} acquisition targets`);
      return opportunities;

    } catch (error) {
      console.error('  ❌ Error scanning MicroAcquire:', error.message);
      return [];
    }
  }

  /**
   * ANALYZE OPPORTUNITIES WITH AI
   * Score each opportunity on multiple factors
   */
  async analyzeOpportunities(opportunities) {
    console.log('\n🧠 Analyzing opportunities with AI...\n');

    const analyzed = [];

    // Batch analyze in groups of 10
    for (let i = 0; i < opportunities.length; i += 10) {
      const batch = opportunities.slice(i, i + 10);

      const prompt = `Analyze these market opportunities and score them:

${JSON.stringify(batch, null, 2)}

For each opportunity, provide:
1. Viability score (0-100)
2. Speed to market (days)
3. Estimated revenue potential (monthly)
4. Competition level (low/medium/high)
5. Our advantage (why we'd win)
6. Product type (notion_template, ai_agent, info_product, saas, acquisition)
7. Target market size
8. Recommended action (build/acquire/pass)

Return JSON array with all opportunities scored.`;

      try {
        const analysis = await generateText(prompt, 'json');

        for (const opp of analysis) {
          analyzed.push({
            ...opp,
            score: opp.viability_score || 0,
            analyzed_at: new Date()
          });
        }

      } catch (error) {
        console.error('  ❌ Analysis error:', error.message);
      }
    }

    console.log(`  ✅ Analyzed ${analyzed.length} opportunities\n`);
    return analyzed;
  }

  /**
   * STORE OPPORTUNITIES IN DATABASE
   */
  async storeOpportunities(opportunities) {
    console.log('💾 Storing opportunities in database...');

    for (const opp of opportunities) {
      try {
        await supabase.from('opportunities').insert({
          source: opp.source,
          title: opp.title || opp.name || opp.query,
          description: JSON.stringify(opp),
          score: opp.score,
          speed_to_market: opp.speed_to_market,
          revenue_potential: opp.revenue_potential,
          competition: opp.competition,
          product_type: opp.product_type,
          action: opp.action,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        // Might not have table yet - that's okay
      }
    }

    console.log(`  ✅ Stored ${opportunities.length} opportunities`);
  }

  /**
   * GENERATE DAILY REPORT
   */
  async generateReport(topOpportunities) {
    console.log('\n📊 Generating daily report...\n');

    const report = `
# 🔍 DAILY OPPORTUNITY REPORT
**Generated:** ${new Date().toLocaleString()}

## 🏆 TOP 10 OPPORTUNITIES

${topOpportunities.map((opp, i) => `
### ${i + 1}. ${opp.title || opp.name || opp.query} (Score: ${opp.score})

**Source:** ${opp.source}
**Speed to Market:** ${opp.speed_to_market} days
**Revenue Potential:** $${opp.revenue_potential}/month
**Competition:** ${opp.competition}
**Action:** ${opp.action}

**Why We'd Win:** ${opp.our_advantage}

**Recommended Action:**
${opp.action === 'build' ? '✅ BUILD - Launch MVP this week' : ''}
${opp.action === 'acquire' ? '💰 ACQUIRE - Due diligence required' : ''}
${opp.action === 'pass' ? '⏭️  PASS - Not worth pursuing' : ''}

---
`).join('\n')}

## 📈 SCAN SUMMARY

- Total opportunities scanned: ${topOpportunities.length}
- Recommended builds: ${topOpportunities.filter(o => o.action === 'build').length}
- Acquisition targets: ${topOpportunities.filter(o => o.action === 'acquire').length}

## 🎯 NEXT STEPS

1. Review top 3 opportunities
2. Approve budget for MVP builds
3. Launch tests this week

---
*Generated by Autonomous Opportunity Scanner*
`;

    console.log(report);

    // TODO: Email this report
    // await sendEmail('geminimummy5@gmail.com', 'Daily Opportunity Report', report);

    return report;
  }
}

/**
 * RUN SCANNER
 */
const runScanner = async () => {
  const scanner = new OpportunityScanner();

  // Check if we should run continuously or just once
  const continuous = process.argv.includes('--continuous');

  if (continuous) {
    // Run forever
    await scanner.scanContinuously();
  } else {
    // Single scan
    await scanner.runScanCycle();
    process.exit(0);
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runScanner().catch(error => {
    console.error('\n❌ Scanner error:', error);
    process.exit(1);
  });
}

export { OpportunityScanner };
