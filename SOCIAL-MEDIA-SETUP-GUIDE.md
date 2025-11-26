# TikTok & Instagram Automation Setup Guide

## Overview
The social media automation system will:
- Generate 15-30 second video scripts for TikTok and Instagram Reels
- Auto-post to TikTok and Instagram (when APIs are configured)
- Use trending formats and hashtags
- Drive viral traffic to your Notion templates
- Link to your products in bio

## Current Status
**Script generation is LIVE!** The system automatically creates:
- TikTok video scripts → saved to `tiktok-scripts/`
- Instagram Reel scripts → saved to `instagram-scripts/`

You can use these scripts to create videos manually OR set up APIs for full automation.

## Option 1: Quick Start (Script Generation Only)

**This works RIGHT NOW:**

1. Run the engine:
```bash
node run-cycle.js
```

2. Check the generated scripts:
```
tiktok-scripts/
  ├── [product-id]-tiktok.json
  └── ...

instagram-scripts/
  ├── [product-id]-instagram.json
  └── ...
```

3. Each script includes:
   - Hook (first 2 seconds)
   - 3 scenes showing features
   - Call-to-action
   - Engaging caption
   - Trending hashtags

4. Create videos using:
   - **CapCut** (free, easy)
   - **Canva** (templates available)
   - **InShot** (mobile app)
   - **Adobe Express**

5. Post manually to TikTok and Instagram

## Option 2: Full Automation

### For TikTok:

#### 1. Create TikTok Business Account
1. Go to https://www.tiktok.com/business
2. Sign up for business account (free)
3. Verify your account

#### 2. Get TikTok API Access
1. Go to https://developers.tiktok.com/
2. Click "Apply for Access"
3. Create an app:
   - App name: Modern Business Mum Automation
   - Category: Content & Publishing
   - Description: Automated template showcase
4. Request these scopes:
   - `video.publish`
   - `video.upload`
5. Once approved, get your Access Token

#### 3. Add to .env
```
TIKTOK_ACCESS_TOKEN=your_token_here
```

### For Instagram:

#### 1. Create Instagram Business Account
1. Convert your Instagram to Business account (free)
2. Connect to Facebook Page (required for API)

#### 2. Get Instagram API Access
1. Go to https://developers.facebook.com/
2. Create an app → "Business" type
3. Add Instagram Graph API product
4. Get long-lived access token using Graph API Explorer
5. Get your Instagram User ID

#### 3. Add to .env
```
INSTAGRAM_ACCESS_TOKEN=your_token_here
INSTAGRAM_USER_ID=your_user_id_here
```

## Video Script Format

Each script includes:

```json
{
  "hook": "POV: You're drowning in business tasks...",
  "scene_1": "Show cluttered workspace → transition to Notion",
  "scene_2": "Highlight dashboard with color-coded tasks",
  "scene_3": "Quick walkthrough of automation features",
  "cta": "Link in bio for $29 - organize your life today!",
  "caption": "This Notion template changed everything for my business 🚀",
  "hashtags": [
    "#NotionTemplate",
    "#ProductivityHacks",
    "#SmallBusiness",
    "#Entrepreneur",
    "#WorkSmarterNotHarder"
  ]
}
```

## Creating Videos from Scripts

### Quick Method (Free):
1. Use **CapCut**
2. Screen record your Notion template
3. Cut into 15-30 second clips following the script
4. Add text overlays for key points
5. Add trending audio
6. Export and post

### AI-Powered Method:
1. Use **InVideo AI** or **Pictory**
2. Paste the script
3. Let AI generate the video
4. Review and adjust
5. Export

### Pro Method:
1. Record yourself presenting (use script as voiceover)
2. Mix with screen recordings
3. Add professional graphics
4. Use **Adobe Premiere** or **Final Cut**

## How The Automation Works

### With Scripts Only (Current):
```
1. Engine creates products
2. Social Poster generates viral scripts
3. Scripts saved to folders
4. You create videos manually
5. You post manually
```

### With Full API Access:
```
1. Engine creates products
2. Social Poster generates scripts
3. Video creation API makes video
4. Auto-posts to TikTok
5. Auto-posts to Instagram Reels
6. All happens 24/7 automatically
```

## Content Strategy

### TikTok Best Practices:
- First 2 seconds are CRITICAL (use strong hook)
- Show results, not process
- Use trending sounds
- Post 1-3 times per day
- Best times: 6-9 AM, 12-3 PM, 7-11 PM

### Instagram Reels Best Practices:
- High-quality visuals matter more
- Use Instagram-specific trends
- Cross-post from TikTok (but optimize)
- Post 1-2 times per day
- Use all 30 hashtags
- Engage with comments in first hour

## Hashtag Strategy

Each script includes optimized hashtags:
- **Broad**: #NotionTemplate #Productivity
- **Niche**: #BusinessPlanner #FinanceTracker
- **Trending**: Check TikTok "Discover" page
- **Community**: #NotionCommunity #ProductivityTok

## Link in Bio Setup

Since you can only have one link:

**Option 1: Direct to Website**
- bio.link: https://modernbusinessmum.com

**Option 2: Use Link Tree**
1. Create Linktree account
2. Add multiple product links
3. Use Linktree URL in bio

**Option 3: Update Bio Per Post**
- Change bio link to match latest post
- Automate with services like Later or Loomly

## Revenue Projection

### With Manual Posting:
- 2 TikToks + 2 Reels per week
- 1,000 avg views → 8,000 views/month
- 5% click rate → 400 clicks
- 3% conversion → 12 sales/month
- **$300/month** (at $25/product)

### With Full Automation:
- 3 TikToks + 3 Reels per day
- 5,000 avg views → 900,000 views/month
- 3% click rate → 27,000 clicks
- 2% conversion → 540 sales/month
- **$13,500/month** (if content goes viral!)

Even with conservative numbers (200 views avg):
- 180 posts/month × 200 views = 36,000 views
- 2% click rate → 720 clicks
- 3% conversion → 22 sales/month
- **$550/month passive**

## Viral Potential

TikTok has MASSIVE viral potential:
- One viral video (1M+ views) can generate 100+ sales
- Templates are trending content
- "Notion hacks" gets millions of views
- Low competition for template creators

## Monitoring Performance

### TikTok Analytics:
1. Go to Pro Account → Analytics
2. Track:
   - Video views
   - Profile views
   - Follower growth
   - Traffic to bio link

### Instagram Insights:
1. Business account → Insights
2. Track:
   - Reel plays
   - Accounts reached
   - Profile visits
   - Link clicks

## Video Creation Tools Comparison

| Tool | Price | Best For | Automation |
|------|-------|----------|------------|
| CapCut | Free | Beginners | Manual |
| Canva | $13/mo | Quick edits | Templates |
| InVideo AI | $20/mo | AI videos | Yes (API) |
| Adobe Express | $10/mo | Quality | Partial |
| Pictory | $23/mo | AI videos | Yes (API) |

## Want Full Video Automation?

I can integrate video creation APIs:

1. **InVideo AI** - Best for automation
   - Text-to-video
   - Template library
   - API available

2. **Pictory** - Good for screen recordings
   - Script-to-video
   - Auto-captions
   - API available

3. **Synthesia** - Professional AI avatars
   - Expensive but highest quality
   - You as AI presenter
   - API available

With integration:
- Scripts generated automatically
- Videos created automatically
- Posted automatically to TikTok & Instagram
- All 24/7 without your involvement!

## Current Automation Status

✅ Script generation - LIVE NOW
✅ TikTok script format - READY
✅ Instagram script format - READY
⏳ TikTok API posting - Awaiting credentials
⏳ Instagram API posting - Awaiting credentials
⏳ Video creation automation - Choose service

## Next Steps

**Right Now:**
1. Run the engine to generate scripts
2. Check `tiktok-scripts/` and `instagram-scripts/` folders
3. Create 1-2 videos manually to test
4. Post and track performance

**When Ready for Full Automation:**
1. Set up TikTok/Instagram business accounts
2. Get API access (takes 1-2 weeks approval)
3. Choose video creation service
4. Let me integrate APIs
5. System runs 24/7 automatically!

## Pro Tips

1. **Batch Create**: Make 10 videos at once, schedule them
2. **Repurpose**: One YouTube video = 5 TikToks
3. **Trending Audio**: Always use trending sounds on TikTok
4. **Captions**: Always add captions (accessibility + engagement)
5. **CTA**: Clear call-to-action in every video
6. **Consistency**: Post daily for best algorithm performance

---

**Your scripts are being generated now!** The system is creating viral-ready content for every product.
