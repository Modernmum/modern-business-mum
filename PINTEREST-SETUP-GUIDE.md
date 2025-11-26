# Pinterest Auto-Posting Setup Guide

## Overview
The Pinterest automation system is now ready! It will automatically:
- Create professional Pinterest pins for each product
- Post them to your Pinterest board
- Use SEO-optimized descriptions with keywords
- Link directly to your Stripe payment pages

## Setup Steps (Takes 10 minutes)

### 1. Create Pinterest Business Account
1. Go to https://www.pinterest.com/business/create/
2. Choose "Create a business account" (it's FREE)
3. Fill in:
   - Business name: Modern Business Mum (or your choice)
   - Website: modernbusinessmum.com
   - Category: Professional Services or Education
4. Complete the setup wizard

### 2. Create a Pinterest Board
1. Click "Create" → "Board"
2. Name it: "Notion Templates" or "Productivity Tools"
3. Make it PUBLIC (so people can discover your pins)
4. Copy the Board ID from the URL (you'll need this later)
   - Example: pinterest.com/modernbusinessmum/notion-templates/
   - The Board ID is the last part after the last slash

### 3. Get Pinterest API Credentials
1. Go to https://developers.pinterest.com/
2. Click "My Apps" → "Create app"
3. Fill in:
   - App name: Modern Business Mum Automation
   - Description: Automated posting for Notion templates
   - Website: modernbusinessmum.com
4. Once created, go to your app's settings
5. Under "OAuth 2.0", add:
   - Redirect URI: https://modernbusinessmum.com/pinterest-callback
   - Scopes: Select "pins:read" and "pins:write"
6. Copy your App ID and App Secret

### 4. Get Access Token
1. In your Pinterest app dashboard, click "Generate Access Token"
2. Select permissions: "pins:read" and "pins:write"
3. Click "Generate"
4. Copy the access token (starts with `pina_`)
   - Important: Save this immediately! It won't be shown again

### 5. Add to Environment Variables

Add these to your `.env` file:

```
PINTEREST_ACCESS_TOKEN=pina_your_token_here
PINTEREST_BOARD_ID=your_board_id_here
```

### 6. Deploy to Vercel

Push the changes to deploy:

```bash
git add .
git commit -m "Add Pinterest automation"
git push
```

The pin image generator will be available at:
`https://modernbusinessmum.com/api/pin-image/[product-id]`

### 7. Test the System

Run a test cycle:

```bash
node run-cycle.js
```

You should see:
```
📌 PINTEREST POSTER AGENT STARTING...
🎯 Creating Pinterest pins for 5 products...
  📌 Pinning: [Product Name]
  ✅ Pin created: [pin-id]
✅ Pinterest Poster Agent completed
📊 Successfully pinned 5/5 products
```

## How It Works

### Automated Flow:
1. **Scout** finds opportunities
2. **Creator** builds Notion templates
3. **Executor** lists on Stripe
4. **Promoter** generates social content
5. **Pinterest Poster** creates and posts pins automatically 🚀

Every 30 minutes (or your chosen interval), the system:
- Takes the 5 most recent products
- Generates a beautiful Pinterest pin image
- Creates an SEO-optimized description
- Posts to your Pinterest board
- Links directly to the Stripe payment page

### Pin Design:
- Size: 1000x1500px (Pinterest optimal)
- Gradient background (blue for business, green for finance)
- Product title in large text
- Top 3 features listed
- Price badge
- Category badge
- Call-to-action

### SEO Keywords Included:
- Notion template
- productivity
- organization
- business/finance (based on niche)
- planner
- digital download

## Monitoring

Track Pinterest performance:
1. Go to https://analytics.pinterest.com/
2. View impressions, saves, clicks
3. See which pins drive the most traffic

## Run Continuously

To run the engine 24/7:

```bash
node run-cycle.js --continuous --interval=30
```

This will:
- Run every 30 minutes
- Scout new opportunities
- Create products
- List on Stripe
- Post to Pinterest
- All fully automated!

## Next Steps

Once Pinterest is working, we can add:
- YouTube video generation (long-form walkthroughs)
- TikTok short videos (viral potential)
- Instagram cross-posting

But Pinterest alone should start driving traffic and sales!

## Troubleshooting

### "Pinterest API not configured"
- Make sure PINTEREST_ACCESS_TOKEN is in your .env file
- Restart the engine after adding credentials

### "No products to pin"
- The system only pins products with status='listed'
- Run the engine to create and list products first

### "Pin creation failed"
- Check that your access token has pins:write permission
- Verify the board ID is correct
- Make sure the board is PUBLIC

## Revenue Projection

With Pinterest automation:
- 100 pins/month (automated)
- 1% click rate → 100 clicks
- 5% conversion → 5 sales/month
- **$125/month passive income** (at $25/product)

And this runs 24/7 without you doing anything!

---

Ready to activate Pinterest automation? Just add the credentials and let it run!
