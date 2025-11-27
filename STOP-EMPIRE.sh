#!/bin/bash

echo "🛑 STOPPING THE EMPIRE..."
echo ""

# Kill processes by PID if files exist
if [ -f logs/product-engine.pid ]; then
    PID=$(cat logs/product-engine.pid)
    if ps -p $PID > /dev/null; then
        echo "   Stopping Product Engine (PID: $PID)..."
        kill $PID
    fi
    rm logs/product-engine.pid
fi

if [ -f logs/scheduler.pid ]; then
    PID=$(cat logs/scheduler.pid)
    if ps -p $PID > /dev/null; then
        echo "   Stopping Scheduler (PID: $PID)..."
        kill $PID
    fi
    rm logs/scheduler.pid
fi

if [ -f logs/delivery.pid ]; then
    PID=$(cat logs/delivery.pid)
    if ps -p $PID > /dev/null; then
        echo "   Stopping Delivery Server (PID: $PID)..."
        kill $PID
    fi
    rm logs/delivery.pid
fi

echo ""
echo "✅ Empire stopped."
echo ""
