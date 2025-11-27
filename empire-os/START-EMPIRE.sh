#!/bin/bash

##############################################################################
#                           EMPIRE OS LAUNCHER                               #
#           One AI engine running 6+ automated business streams              #
##############################################################################

echo ""
echo "████████████████████████████████████████████████████████████████████████████████"
echo "█                                                                              █"
echo "█                             EMPIRE OS v1.0                                   █"
echo "█                   The Complete Automation Platform                           █"
echo "█                                                                              █"
echo "████████████████████████████████████████████████████████████████████████████████"
echo ""
echo "Starting automated business empire..."
echo ""

# Create logs directory
mkdir -p logs

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
if [ -f logs/empire.pid ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
        fi
    done < logs/empire.pid
    rm logs/empire.pid
fi

echo "✅ Ready to launch"
echo ""

# Function to launch service
launch_service() {
    local name=$1
    local script=$2

    echo "🚀 Starting $name..."
    nohup node $script > logs/$name.log 2>&1 &
    local pid=$!
    echo $pid >> logs/empire.pid
    echo "   ✅ $name running (PID: $pid)"
}

# BUSINESS 1: Template Studio
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 TEMPLATE STUDIO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
launch_service "template-engine" "../run-cycle.js"
launch_service "delivery-server" "../delivery-server.js"
echo "   💰 Revenue Target: \$5k/month"
echo ""

# BUSINESS 2: Lead Generation Engine
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 LEAD GENERATION ENGINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📊 Scrapes business directories, qualifies leads with AI"
echo "   💰 Revenue Target: \$5k-20k/month"
echo "   ⏰ Running weekly on Mondays at 9am"
echo ""

# BUSINESS 3: Content Agency
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✍️  CONTENT AGENCY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📝 AI writes blog posts, publishes to client sites"
echo "   💰 Revenue Target: 10 clients × \$3k = \$30k/month"
echo "   ⏰ Running daily at 6am"
echo ""

# BUSINESS 4: Cold Email Outreach
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📧 COLD EMAIL OUTREACH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔍 Scrapes LinkedIn, AI writes personalized emails, auto-follows up"
echo "   💰 Revenue Target: \$3k-15k/month"
echo "   ⏰ Follow-ups sent daily at 8am"
echo ""

# BUSINESS 5: Job Board
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💼 AUTOMATED JOB BOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🤖 Scrapes jobs, auto-populates board, companies pay to feature"
echo "   💰 Revenue Target: \$5k-30k/month"
echo "   ⏰ Running daily at 3am"
echo ""

# BUSINESS 6: Social Media Management
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 SOCIAL MEDIA MANAGEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📅 AI creates posts, auto-schedules across platforms"
echo "   💰 Revenue Target: 20 clients × \$2k = \$40k/month"
echo "   ⏰ Posts published throughout the day"
echo ""

# BUSINESS 7: SEO Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SEO CONTENT SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📊 AI generates SEO content, builds backlinks, publishes automatically"
echo "   💰 Revenue Target: \$10k-40k/month"
echo "   ⏰ Running weekly on Wednesdays at 10am"
echo ""

# Master scheduler
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  MASTER SCHEDULER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
launch_service "empire-scheduler" "empire-scheduler.js"
echo ""

echo "████████████████████████████████████████████████████████████████████████████████"
echo "█                                                                              █"
echo "█                        ✅ EMPIRE OS LAUNCHED                                 █"
echo "█                                                                              █"
echo "█                    TOTAL REVENUE TARGET: \$140k/month                        █"
echo "█                           \$1.68M/year                                        █"
echo "█                                                                              █"
echo "████████████████████████████████████████████████████████████████████████████████"
echo ""
echo "📊 Status:"
echo "   • All automation agents running"
echo "   • Logs: ./logs/"
echo "   • Stop: ./STOP-EMPIRE.sh"
echo ""
echo "🎯 Next Steps:"
echo "   1. Monitor logs for activity: tail -f logs/*.log"
echo "   2. Check dashboard: node empire-os/dashboard.js"
echo "   3. Get first clients: Run marketing automation"
echo ""
echo "🚀 Let the empire print money..."
echo ""
