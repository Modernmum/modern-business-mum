#!/bin/bash

# OPPORTUNITY SCANNER - 24/7 DEPLOYMENT
# Runs continuously scanning for empire opportunities

echo "🚀 Starting Opportunity Scanner"
echo "================================="
echo ""
echo "This will run 24/7 scanning for opportunities every 6 hours."
echo ""
echo "Sources:"
echo "  ✅ Reddit (pain points)"
echo "  ✅ Google Trends (rising searches)"
echo "  ✅ Product Hunt (new launches)"
echo "  ✅ Indie Hackers (revenue reports)"
echo "  ✅ MicroAcquire (acquisition targets)"
echo ""
echo "Output: Daily reports in console + database"
echo ""

# Run continuously
node agents/opportunity-scanner.js --continuous

# If it crashes, restart
while [ $? -ne 0 ]; do
  echo "❌ Scanner crashed. Restarting in 60 seconds..."
  sleep 60
  node agents/opportunity-scanner.js --continuous
done
