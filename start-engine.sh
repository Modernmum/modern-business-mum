#!/bin/bash

# Zero to Legacy Engine - Full Autonomous Startup
# This script starts all services needed for 24/7 operation

echo "🚀 Starting Zero to Legacy Engine..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "${GREEN}✓${NC} Environment file found"

# Start the delivery server in background
echo "${BLUE}Starting delivery server...${NC}"
node delivery-server.js > logs/delivery.log 2>&1 &
DELIVERY_PID=$!
echo "${GREEN}✓${NC} Delivery server started (PID: $DELIVERY_PID)"

# Wait a moment for server to start
sleep 2

# Start the engine in continuous mode (every 30 minutes)
echo "${BLUE}Starting autonomous engine...${NC}"
node run-cycle.js --continuous --interval=30 > logs/engine.log 2>&1 &
ENGINE_PID=$!
echo "${GREEN}✓${NC} Engine started in continuous mode (PID: $ENGINE_PID)"

# Save PIDs for later stopping
echo $DELIVERY_PID > .delivery.pid
echo $ENGINE_PID > .engine.pid

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║                                                  ║"
echo "║   🎉 ZERO TO LEGACY ENGINE IS NOW LIVE! 🎉     ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "📊 Monitor your system:"
echo "   • Dashboard: open dashboard.html"
echo "   • Website: open public/index.html"
echo "   • Delivery logs: tail -f logs/delivery.log"
echo "   • Engine logs: tail -f logs/engine.log"
echo ""
echo "🛑 To stop the engine:"
echo "   ./stop-engine.sh"
echo ""
echo "💰 Every 30 minutes, the engine will:"
echo "   1. Discover new product opportunities"
echo "   2. Create Notion templates"
echo "   3. List them on Stripe"
echo "   4. Generate social media promotions"
echo ""
echo "🔔 When customers buy:"
echo "   • Templates delivered automatically via email"
echo "   • Sales tracked in Supabase"
echo "   • Revenue updated in real-time"
echo ""
