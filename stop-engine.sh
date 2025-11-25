#!/bin/bash

# Stop the Zero to Legacy Engine

echo "🛑 Stopping Zero to Legacy Engine..."

# Stop delivery server
if [ -f .delivery.pid ]; then
    DELIVERY_PID=$(cat .delivery.pid)
    if ps -p $DELIVERY_PID > /dev/null; then
        kill $DELIVERY_PID
        echo "✓ Delivery server stopped"
    fi
    rm .delivery.pid
fi

# Stop engine
if [ -f .engine.pid ]; then
    ENGINE_PID=$(cat .engine.pid)
    if ps -p $ENGINE_PID > /dev/null; then
        kill $ENGINE_PID
        echo "✓ Engine stopped"
    fi
    rm .engine.pid
fi

echo ""
echo "✅ All services stopped"
