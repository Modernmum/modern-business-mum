# Reddit API Setup Guide

To enable automated Reddit posting via API (much more reliable than browser automation), you need to create a Reddit app.

## Step 1: Create Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Scroll to bottom and click "create another app..."
3. Fill in:
   - **name:** Modern Business Mum Bot
   - **type:** Select "script"
   - **description:** Automated posting for Modern Business Mum
   - **about url:** (leave blank)
   - **redirect uri:** http://localhost:8080
4. Click "create app"

## Step 2: Get Credentials

After creating, you'll see:
- **Client ID** (under "personal use script" - looks like: `AbCdEf123456`)
- **Client Secret** (next to "secret" - looks like: `aBcDeFgHiJkLmNoPqRsTuV123`)

## Step 3: Add to .env

Add these lines to your `.env` file:

```bash
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USERNAME=ModernBusinessMum
REDDIT_PASSWORD=Modernmummy2026!
```

## Step 4: Test

Run the test script:

```bash
node agents/reddit-api-poster.js
```

You should see posts going live to r/Notion, r/productivity, r/Entrepreneur!

## Important Notes

- Reddit has rate limits: 1 post per 10 minutes per subreddit
- Your account needs some karma before posting to most subreddits
- Some subreddits have automod rules that may remove new accounts
- The API is much more reliable than browser automation

## Subreddit Rules to Know

**r/Notion:**
- No affiliate links
- Templates are allowed
- Be helpful, not spammy

**r/productivity:**
- Must provide value
- Self-promotion limited
- Tools/templates allowed if useful

**r/Entrepreneur:**
- More lenient with self-promotion
- Share your journey
- Templates/tools welcome
