#!/bin/bash

# DAILY FREE TRAFFIC AUTOMATION
# Run this once per day to post to all social platforms
# 100% free traffic, zero ad spend

echo "🚀 Starting Daily Free Traffic Automation"
echo "=========================================="
echo ""

# Set working directory
cd "$(dirname "$0")"

# Load environment
export $(cat .env | xargs)

# 1. Post to all social platforms (3 products per day)
echo "📢 Posting to social platforms..."
node agents/free-traffic-master.js 3

# 2. Generate SEO blog posts (2 new posts per day)
echo ""
echo "📝 Generating SEO blog content..."
node agents/seo-content-machine.js 2

# 3. Deploy to production
echo ""
echo "🚀 Deploying to Vercel..."
npx vercel --prod --yes

# 4. Create 2 new products
echo ""
echo "📦 Creating new products..."
node agents/creator.js --count 2

echo ""
echo "=========================================="
echo "✅ Daily automation complete!"
echo ""
echo "📊 Daily Impact:"
echo "   - 3 social media posts (Twitter, Pinterest, Facebook)"
echo "   - 2 SEO blog posts for Google"
echo "   - 2 new products created"
echo "   - Deployed to production"
echo ""
echo "💡 Set this up as a cron job to run automatically:"
echo "   0 9 * * * /path/to/run-daily-automation.sh"
echo ""
