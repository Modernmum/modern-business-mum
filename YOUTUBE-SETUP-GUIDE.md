# YouTube Auto-Publishing Setup Guide

## Overview
The YouTube automation system will:
- Generate professional video scripts for template walkthroughs
- Auto-upload videos to your YouTube channel
- Optimize titles, descriptions, and tags for SEO
- Link directly to your Stripe payment pages
- Build long-term passive traffic (videos rank in Google forever!)

## Current Status
**The system is ready to generate video scripts!** It will save them to `youtube-scripts/` folder. You can then:
1. Use the scripts to create videos manually (easy with AI video tools), OR
2. Complete the YouTube API setup for full automation

## Option 1: Quick Start (Script Generation Only)

**This works RIGHT NOW without any setup:**

1. Run the engine:
```bash
node run-cycle.js
```

2. The YouTube agent will generate professional video scripts and save them to:
```
youtube-scripts/
  ├── [product-id]-script.json
  ├── [product-id]-script.json
  └── ...
```

3. Each script includes:
   - Hook (first 5 seconds)
   - Introduction
   - Feature walkthrough
   - Benefits summary
   - Call-to-action
   - SEO-optimized title
   - SEO-optimized description
   - Tags/keywords
   - Timestamps

4. Use AI video tools to create videos:
   - **InVideo AI** (invideo.ai) - Paste script, generates video
   - **Pictory** (pictory.ai) - Script to video
   - **Descript** (descript.com) - AI avatars
   - **Synthesia** (synthesia.io) - Professional AI presenters

## Option 2: Full Automation (YouTube API Setup)

For fully automated uploads to YouTube, follow these steps:

### 1. Create YouTube Channel
1. Go to https://youtube.com
2. Click your profile → "Create a channel"
3. Name it: "Modern Business Mum" or your brand name
4. Set up channel description, branding, etc.

### 2. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project: "Modern Business Mum Automation"
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen:
   - User Type: External
   - App name: Modern Business Mum Automation
   - User support email: your email
   - Developer email: your email
4. Create OAuth client ID:
   - Application type: Web application
   - Name: YouTube Auto-Upload
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
5. Download the credentials JSON file

### 4. Get Refresh Token
Run this one-time setup script (I'll create it for you):

```bash
node scripts/youtube-auth.js
```

This will:
1. Open a browser for you to authorize the app
2. Get the refresh token
3. Save it to your .env file

### 5. Add to Environment Variables

Add these to your `.env` file:

```
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
```

### 6. Create Videos (For Full Automation)

The system expects video files in this format:
```
videos/
  └── [product-id].mp4
```

**Automated Video Creation Options:**

1. **Use InVideo API** (Recommended)
   - Sign up at https://invideo.io/api
   - They have an API that converts scripts to videos
   - Add to .env: `INVIDEO_API_KEY=xxx`

2. **Use Pictory API**
   - Sign up at https://pictory.ai
   - They convert scripts to videos via API

3. **Use Synthesia API**
   - Professional AI avatars
   - More expensive but highest quality

I can integrate any of these APIs if you want fully automated video creation!

## How It Works

### With Script Generation Only:
1. Engine creates products
2. YouTube agent generates video scripts
3. Scripts saved to `youtube-scripts/` folder
4. You create videos manually using AI tools
5. Upload to YouTube manually

### With Full Automation:
1. Engine creates products
2. YouTube agent generates video scripts
3. Video creation API makes the video automatically
4. YouTube agent uploads to your channel automatically
5. Video is live with SEO optimization
6. All happens 24/7 without you doing anything!

## Video Script Format

Each script includes:

```json
{
  "hook": "In just 60 seconds, I'll show you how to...",
  "intro": "Welcome to Modern Business Mum...",
  "feature_walkthrough": [
    "First, let's look at the dashboard...",
    "Next, we have the tracking system...",
    "Finally, the reporting feature..."
  ],
  "benefits": "With this template, you'll save 10 hours per week...",
  "cta": "Get this template now at the link in the description...",
  "timestamps": [
    "0:00 - Introduction",
    "0:30 - Dashboard Overview",
    "1:15 - Tracking System",
    "2:00 - Reports & Analytics",
    "2:45 - Conclusion"
  ],
  "video_title": "How to Track Your Business Finances in Notion | Free Template",
  "video_description": "Complete description with keywords and links...",
  "tags": ["notion template", "business finance", "productivity", ...]
}
```

## SEO Optimization

Every video includes:
- Title optimized for "Notion template [category]" searches
- Description with target keywords
- Tags for discoverability
- Timestamps (YouTube loves these)
- Clear CTA with buy link
- Links to your website

## Revenue Projection

### With Script Generation (Manual Upload):
- 4 videos/month (one per week)
- 500 views each → 2,000 views/month
- 3% click rate → 60 clicks
- 5% conversion → 3 sales/month
- **$75/month** (at $25/product)

### With Full Automation:
- 10 videos/month (automated)
- 1,000 views each → 10,000 views/month
- 2% click rate → 200 clicks
- 5% conversion → 10 sales/month
- **$250/month passive income**

Plus, YouTube videos compound over time. After 12 months, you could have 120 videos generating passive income forever!

## Next Steps

**Right now:**
- Scripts are being generated automatically
- Check `youtube-scripts/` folder

**When you're ready for full automation:**
- Set up YouTube API (10 minutes)
- Choose a video creation API
- Let me integrate it
- Videos automatically upload 24/7

## Monitoring

Track YouTube performance:
1. Go to YouTube Studio (studio.youtube.com)
2. View analytics:
   - Views
   - Watch time
   - Traffic sources
   - Click-through rate on links
3. See which videos drive the most sales

## Troubleshooting

### "No products to create videos for"
- Run the engine to create products first
- The YouTube agent processes the 3 most recent products per cycle

### Scripts not generating
- Check that Claude AI is working (test with run-cycle.js)
- Check the console for errors

### "YouTube API not configured"
- This is normal! Scripts will still be saved
- Set up YouTube API when you want full automation

## Video Creation Tips

When making videos from the scripts:
1. Keep it under 5 minutes (optimal for Notion template walkthroughs)
2. Use screen recordings of the template
3. Add voiceover from the script
4. Include text overlays for key features
5. Use upbeat background music
6. Add your logo/branding
7. Include clear CTA at the end

## Video Tools Comparison

| Tool | Price | Quality | Automation |
|------|-------|---------|------------|
| InVideo AI | $20/mo | Good | Yes (API) |
| Pictory | $23/mo | Good | Yes (API) |
| Synthesia | $89/mo | Excellent | Yes (API) |
| Descript | $24/mo | Good | Partial |
| Manual (Canva + CapCut) | Free | Variable | No |

## Want Full Video Automation?

Let me know which video creation service you want to use, and I'll integrate it!

Options:
1. InVideo AI (easiest, good quality)
2. Pictory (good for screen recordings)
3. Synthesia (professional AI presenters)

With full integration:
- Products created automatically
- Scripts generated automatically
- Videos created automatically
- Uploaded to YouTube automatically
- All 24/7 with zero work from you!

---

**Your scripts are being generated now!** Check the `youtube-scripts/` folder to see them.
