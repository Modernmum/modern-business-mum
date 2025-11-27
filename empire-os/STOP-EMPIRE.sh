#!/bin/bash

##############################################################################
#                        EMPIRE OS SHUTDOWN SCRIPT                           #
##############################################################################

echo ""
echo "🛑 Shutting down Empire OS..."
echo ""

# Check for PID file
if [ ! -f logs/empire.pid ]; then
    echo "❌ No running Empire OS processes found (logs/empire.pid not found)"
    echo ""
    exit 1
fi

echo "📋 Stopping all automation agents..."
echo ""

# Read PIDs and kill processes
killed=0
while read pid; do
    if ps -p $pid > /dev/null 2>&1; then
        echo "   Stopping process $pid..."
        kill $pid 2>/dev/null
        killed=$((killed+1))
    fi
done < logs/empire.pid

# Remove PID file
rm logs/empire.pid

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "✅ Empire OS stopped successfully"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "   Processes stopped: $killed"
echo "   Logs preserved in: ./logs/"
echo ""
echo "   To restart: ./START-EMPIRE.sh"
echo ""
