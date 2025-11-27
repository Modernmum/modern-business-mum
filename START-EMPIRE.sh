#!/bin/bash

echo "🚀 STARTING THE EMPIRE..."
echo ""
echo "This will start all automation systems:"
echo "  - Product creation (runs continuously)"
echo "  - Social media posting (3x daily)"
echo "  - Fiverr order checking (hourly)"
echo "  - Pinterest posting (daily)"
echo ""
echo "All processes will run in the background."
echo ""
sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

echo "🔄 Starting product creation cycle..."
nohup node run-cycle.js --continuous --interval=60 > logs/product-engine.log 2>&1 &
PRODUCT_PID=$!
echo "   Process ID: $PRODUCT_PID"

echo "📅 Starting automation scheduler..."
nohup node automation-scheduler.js > logs/scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo "   Process ID: $SCHEDULER_PID"

echo "💰 Starting delivery server..."
nohup node delivery-server.js > logs/delivery.log 2>&1 &
DELIVERY_PID=$!
echo "   Process ID: $DELIVERY_PID"

# Save PIDs to file for later management
echo "$PRODUCT_PID" > logs/product-engine.pid
echo "$SCHEDULER_PID" > logs/scheduler.pid
echo "$DELIVERY_PID" > logs/delivery.pid

echo ""
echo "✅ EMPIRE IS RUNNING!"
echo ""
echo "📊 View logs:"
echo "   Product Engine: tail -f logs/product-engine.log"
echo "   Scheduler: tail -f logs/scheduler.log"
echo "   Delivery: tail -f logs/delivery.log"
echo ""
echo "🛑 Stop all: bash STOP-EMPIRE.sh"
echo ""
echo "Your automation is now running 24/7."
echo "Products will be created, listed, and posted automatically."
echo ""
