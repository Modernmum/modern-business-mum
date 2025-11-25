# 🚀 Deployment Guide - Zero to Legacy Engine

## Current Status: ✅ READY FOR 24/7 OPERATION

Your engine is fully built and tested! Here's how to deploy it for autonomous operation.

---

## Option 1: Run Locally (Easiest - Start Now!)

### Start the Engine:
```bash
./start-engine.sh
```

This will:
- Start the delivery server (port 3000)
- Start the engine in continuous mode (runs every 30 minutes)
- Create logs in `/logs` folder
- Save process IDs for easy stopping

### Monitor:
```bash
# Watch delivery logs
tail -f logs/delivery.log

# Watch engine logs
tail -f logs/engine.log

# Open dashboard
open dashboard.html

# View your storefront
open public/index.html
```

### Stop the Engine:
```bash
./stop-engine.sh
```

### Keep Running After You Close Terminal:
```bash
nohup ./start-engine.sh &
```

---

## Option 2: Deploy to Railway (Recommended for 24/7)

Railway provides free hosting perfect for this project.

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Project
```bash
railway init
```

### Step 4: Add Environment Variables
Go to Railway dashboard and add all variables from your `.env` file:
- SUPABASE_URL
- SUPABASE_KEY
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY
- RESEND_API_KEY
- STRIPE_WEBHOOK_SECRET

### Step 5: Deploy
```bash
railway up
```

### Step 6: Set Up Stripe Webhook
1. Get your Railway app URL: `railway domain`
2. Go to Stripe Dashboard → Webhooks
3. Add endpoint: `https://your-app.railway.app/webhook`
4. Select event: `checkout.session.completed`
5. Copy webhook secret and add to Railway environment variables

---

## Option 3: Deploy to DigitalOcean (Most Control)

### Step 1: Create Droplet
1. Go to DigitalOcean
2. Create new Droplet (Ubuntu 22.04, $6/month)
3. SSH into your droplet

### Step 2: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Clone Your Project
```bash
git clone <your-repo>
cd zero-to-legacy-engine
npm install
```

### Step 4: Set Up Environment
```bash
nano .env
# Paste all your environment variables
```

### Step 5: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 6: Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Paste:
```javascript
module.exports = {
  apps: [
    {
      name: 'delivery-server',
      script: 'delivery-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'engine',
      script: 'run-cycle.js',
      args: '--continuous --interval=30',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    }
  ]
};
```

### Step 7: Start Services
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 8: Set Up Nginx (Optional - for website)
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/modernbusinessmum
```

Paste:
```nginx
server {
    listen 80;
    server_name modernbusinessmum.com www.modernbusinessmum.com;

    root /root/zero-to-legacy-engine/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/modernbusinessmum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Option 4: Deploy Website to Vercel (Static Site)

Perfect for hosting the storefront website!

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd public
vercel
```

### Step 3: Set Custom Domain
In Vercel dashboard:
1. Go to your project
2. Settings → Domains
3. Add: modernbusinessmum.com
4. Follow DNS configuration instructions

---

## Social Media Automation (TikTok, Twitter, Instagram)

### Current Status:
✅ Content is auto-generated and saved to `/promotions` folder

### Option A: Manual Posting (Current)
1. Check `/promotions` folder for latest posts
2. Copy content for each platform
3. Post manually to TikTok, Twitter, Instagram

### Option B: Auto-Posting (Advanced)

#### Twitter Auto-Post:
```bash
npm install twitter-api-v2
```

Add to `.env`:
```
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
```

Create `agents/social-poster.js` to auto-post tweets.

#### Instagram/TikTok:
- Requires business accounts and API approval
- Alternative: Use Buffer or Hootsuite APIs
- Or use Meta Business Suite for scheduled posts

---

## Monitoring & Maintenance

### Check System Health:
```bash
# Local
tail -f logs/engine.log

# Railway
railway logs

# DigitalOcean
pm2 logs
```

### Monitor Sales:
- Open `dashboard.html`
- Check Stripe dashboard
- View Supabase database

### Update Products:
The engine runs automatically every 30 minutes and will:
1. Discover new opportunities (if queue has space)
2. Create new templates
3. List them on Stripe
4. Generate promotions

### Manual Run:
```bash
# Run one cycle
node run-cycle.js

# Run continuously
node run-cycle.js --continuous --interval=30
```

---

## Webhook Testing

### Local Testing with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/webhook
```

### Test Purchase:
1. Go to any Stripe payment link
2. Use test card: `4242 4242 4242 4242`
3. Complete purchase
4. Check logs for delivery confirmation

---

## Troubleshooting

### Templates Not Sending?
- Check Resend API key is valid
- Verify webhook secret matches
- Check delivery server logs

### Engine Not Running?
- Check Claude API credits
- Verify Supabase connection
- Check system logs

### No New Products?
- Queue might be full (check dashboard)
- Increase opportunities per cycle in `config/settings.js`
- Check for errors in engine logs

---

## Cost Breakdown

### Current Monthly Costs:
- **Supabase**: FREE (up to 500MB database)
- **Claude API**: ~$5-20/month (depends on usage)
- **Stripe**: FREE (2.9% + 30¢ per transaction)
- **Resend**: FREE (up to 3,000 emails/month)
- **Railway**: FREE tier available ($5/month for always-on)
- **DigitalOcean**: $6/month (droplet)
- **Vercel**: FREE (static site hosting)

**Total: $0-26/month** (depending on hosting choice)

---

## What Happens Now?

### Automatic Operation:
1. **Every 30 minutes**: Engine discovers opportunities, creates templates, lists on Stripe
2. **When customer buys**: Stripe webhook → Delivery server → Email sent automatically
3. **Promotions**: Generated and saved to `/promotions` folder (post manually or auto-post)

### Your Role:
- Post social media content (or set up auto-posting)
- Monitor sales and respond to customer emails
- Optionally: adjust pricing, categories, or features in `config/settings.js`

---

## Next Level Upgrades

### Future Enhancements:
- Auto-post to social media platforms
- Add more product categories
- Create product bundles
- Email marketing for repeat customers
- Analytics and conversion tracking
- A/B testing for pricing
- Customer review collection
- Affiliate program

---

## 🎉 You're Ready!

Your autonomous wealth engine is **complete and operational**. Start it up and let it run!

```bash
./start-engine.sh
```

Then check your dashboard and watch the magic happen! 💰
