# Zero to Legacy Wealth Engine

An autonomous AI-powered system that discovers opportunities, creates Notion templates, and lists them for sale automatically.

## Overview

The Zero to Legacy Engine is a multi-agent system that operates autonomously to generate revenue through Notion template sales:

1. **Scout Agent** - Discovers opportunities from configured niches and categories
2. **Creator Agent** - Builds complete Notion templates using Claude AI
3. **Executor Agent** - Lists products on Gumroad (or generates manual instructions)

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **Sales Platform**: Gumroad API

## Target Niches

### Business/Entrepreneurs
- Client CRM ($29)
- Project Dashboard ($25)
- SOP Library ($35)
- Meeting Notes ($19)
- OKR Tracker ($25)
- Business Dashboard ($45)
- Content Calendar ($22)

### Finance/Budgeting
- Budget Tracker ($19)
- Net Worth Dashboard ($25)
- Debt Payoff Planner ($22)
- Investment Portfolio ($29)
- Savings Goal Tracker ($15)
- Financial Freedom Dashboard ($35)

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Anthropic API key (Claude)
- Gumroad account (optional, for automatic listing)

## Installation

1. **Clone or download the repository**

```bash
cd zero-to-legacy-engine
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

- Create a new project at [supabase.com](https://supabase.com)
- Go to SQL Editor and run the contents of `database-setup.sql`
- Get your project URL and anon key from Settings > API

4. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
GUMROAD_API_KEY=your-gumroad-key  # Optional
```

5. **Get API Keys**

- **Anthropic**: Get your API key from [console.anthropic.com](https://console.anthropic.com)
- **Gumroad**: Get your API key from Settings > Advanced > Applications (optional)

## Usage

### Run a Single Cycle

Execute one complete cycle (Scout → Creator → Executor):

```bash
node run-cycle.js
```

or

```bash
npm start
```

### Run in Continuous Mode

Run cycles automatically at specified intervals:

```bash
# Run every 60 minutes (default)
node run-cycle.js --continuous

# Run every 30 minutes
node run-cycle.js --continuous --interval=30

# Run every 2 hours
node run-cycle.js --continuous --interval=120
```

### Run Individual Agents

You can also run agents independently:

```bash
# Run only Scout Agent
npm run scout

# Run only Creator Agent
npm run creator

# Run only Executor Agent
npm run executor
```

## How It Works

### 1. Scout Agent

- Analyzes configured template categories
- Uses AI to score opportunity viability (0-100)
- Stores promising opportunities in database
- Respects queue limits to prevent overload

### 2. Creator Agent

- Takes discovered opportunities
- Generates complete template structures with Claude AI
- Creates sales descriptions optimized for conversion
- Stores products with all details in database

### 3. Executor Agent

- Lists created products on Gumroad via API
- Falls back to manual instructions if no API key
- Creates drafts or publishes based on configuration
- Tracks listing status and URLs

## Configuration

Edit `config/settings.js` to customize:

- Target niches and categories
- Agent behavior (rates, thresholds)
- Pricing strategy
- API rate limits
- Template defaults

Key settings:

```javascript
CONFIG.agents.scout.opportunitiesPerCycle = 3;  // Opportunities per run
CONFIG.agents.creator.maxCreationsPerCycle = 2; // Products per run
CONFIG.agents.executor.maxListingsPerCycle = 2; // Listings per run
CONFIG.agents.executor.autoPublish = false;     // Auto-publish or draft
```

## Database Structure

The system uses 5 main tables:

- `opportunities` - Discovered opportunities
- `products` - Created templates
- `listings` - Product listings on platforms
- `transactions` - Sales and revenue tracking
- `system_logs` - Agent activity logs

## Monitoring

View system statistics and agent status at the start of each cycle:

```
📊 SYSTEM STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Opportunities Discovered: 15
  Products Created:         8
  Listings Created:         5
  Total Sales:              12
  Total Revenue:            $347.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Manual Listing

If you don't provide a Gumroad API key, the Executor Agent will generate detailed manual listing instructions for each product, including:

- Exact title to use
- Complete description
- Price point
- Feature highlights
- Platform-specific settings

## Troubleshooting

### Database Connection Failed

- Verify your Supabase URL and key in `.env`
- Ensure you've run `database-setup.sql` in Supabase SQL Editor
- Check that your Supabase project is active

### AI Connection Failed

- Verify your Anthropic API key in `.env`
- Check your API key has sufficient credits
- Ensure you're using a valid key from console.anthropic.com

### Gumroad Listing Failed

- Verify your Gumroad API key (Settings > Advanced > Applications)
- Check if the product already exists on Gumroad
- Review the error message in console output
- System will fall back to manual instructions

### No Opportunities Created

- Check the `trendScoreThreshold` in config/settings.js
- Lower the threshold to allow more opportunities
- Review system logs for scoring details

## Safety Features

- **Queue Limits**: Prevents overwhelming the system with too many items
- **Draft Mode**: Creates drafts by default instead of auto-publishing
- **Error Handling**: Individual failures don't stop the entire cycle
- **Activity Logging**: All actions logged to database
- **Rate Limiting**: Built-in delays between API calls

## Cost Considerations

- **Claude API**: ~$0.01-0.05 per template generation
- **Supabase**: Free tier supports thousands of operations
- **Gumroad**: No API fees, standard 10% transaction fee

Estimated cost per cycle: $0.05-0.15 (depending on agent activity)

## Scaling

To increase output:

1. Adjust `opportunitiesPerCycle`, `maxCreationsPerCycle`, and `maxListingsPerCycle` in config
2. Run multiple cycles per day with `--continuous` mode
3. Add more niches and categories to config/settings.js
4. Increase queue thresholds for larger batch processing

## Best Practices

1. **Start Small**: Run single cycles first to verify everything works
2. **Monitor Logs**: Check `system_logs` table regularly
3. **Review Products**: Manually review generated products before listing
4. **Adjust Scoring**: Tune trend score thresholds based on results
5. **Test Listings**: Use draft mode initially, then enable auto-publish

## Project Structure

```
zero-to-legacy-engine/
├── agents/
│   ├── scout.js          # Opportunity discovery
│   ├── creator.js        # Template generation
│   └── executor.js       # Product listing
├── config/
│   └── settings.js       # System configuration
├── lib/
│   ├── database.js       # Supabase client
│   └── ai.js             # Claude API wrapper
├── database-setup.sql    # Database schema
├── run-cycle.js          # Main orchestrator
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md             # Documentation
```

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

Built with Claude AI and Supabase
