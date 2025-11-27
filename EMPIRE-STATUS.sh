#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                         THE EMPIRE STATUS REPORT                      "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if processes are running
echo "🤖 AUTOMATION SYSTEMS:"
echo ""

if [ -f logs/product-engine.pid ]; then
    PID=$(cat logs/product-engine.pid)
    if ps -p $PID > /dev/null; then
        echo "   ✅ Product Engine (PID: $PID) - RUNNING"
    else
        echo "   ❌ Product Engine - STOPPED"
    fi
else
    echo "   ❌ Product Engine - NOT STARTED"
fi

if [ -f logs/scheduler.pid ]; then
    PID=$(cat logs/scheduler.pid)
    if ps -p $PID > /dev/null; then
        echo "   ✅ Scheduler (PID: $PID) - RUNNING"
    else
        echo "   ❌ Scheduler - STOPPED"
    fi
else
    echo "   ❌ Scheduler - NOT STARTED"
fi

if [ -f logs/delivery.pid ]; then
    PID=$(cat logs/delivery.pid)
    if ps -p $PID > /dev/null; then
        echo "   ✅ Delivery Server (PID: $PID) - RUNNING"
    else
        echo "   ❌ Delivery Server - STOPPED"
    fi
else
    echo "   ❌ Delivery Server - NOT STARTED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 BUSINESS METRICS:"
echo ""

# Get stats from database
node -e "
import { getSystemStats } from './lib/database.js';

getSystemStats().then(stats => {
  console.log('   Products Created:    ', stats.products);
  console.log('   Total Sales:         ', stats.totalSales);
  console.log('   Total Revenue:       \$' + stats.totalRevenue);
  console.log('   Opportunities Found: ', stats.opportunities);
  process.exit(0);
}).catch(err => {
  console.log('   ⚠️  Could not fetch stats');
  process.exit(1);
});
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 RECENT ACTIVITY:"
echo ""
echo "   Last 5 lines from Product Engine:"
tail -5 logs/product-engine.log 2>/dev/null | sed 's/^/      /' || echo "      No logs yet"
echo ""
echo "   Last 5 lines from Scheduler:"
tail -5 logs/scheduler.log 2>/dev/null | sed 's/^/      /' || echo "      No logs yet"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 COMMANDS:"
echo ""
echo "   View Live Logs:      tail -f logs/product-engine.log"
echo "   Stop Empire:         bash STOP-EMPIRE.sh"
echo "   Restart Empire:      bash STOP-EMPIRE.sh && bash START-EMPIRE.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
