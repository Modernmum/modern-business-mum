# 🔑 API TOKEN REGENERATION GUIDE

**Status:** Twitter and Reddit tokens need regeneration
**Updated:** November 28, 2025

---

## 🐦 TWITTER API TOKENS (PRIORITY 1)

### Current Status:
❌ ACCESS_TOKEN and ACCESS_TOKEN_SECRET are expired/invalid (401 error)

### How to Regenerate:

1. **Go to Twitter Developer Portal:**
   - URL: https://developer.twitter.com/en/portal/projects-and-apps
   - Log in with your @ModernBusinessMum account

2. **Select Your App:**
   - Find your app in the dashboard
   - Click on it to open settings

3. **Navigate to Keys and Tokens:**
   - Click the "Keys and tokens" tab
   - Scroll to "Authentication Tokens" section

4. **Regenerate Access Token & Secret:**
   - Click "Regenerate" button for Access Token and Secret
   - ⚠️ **CRITICAL:** Copy both tokens IMMEDIATELY
   - They will only be shown once!

5. **Update .env File:**
   ```bash
   TWITTER_ACCESS_TOKEN=<paste_new_token_here>
   TWITTER_ACCESS_TOKEN_SECRET=<paste_new_secret_here>
   ```

6. **Test Connection:**
   ```bash
   node scripts/test-twitter-auth.js
   ```

### What NOT to Regenerate:
- ✅ Keep TWITTER_API_KEY (Consumer Key)
- ✅ Keep TWITTER_API_SECRET (Consumer Secret)
- ✅ Keep TWITTER_BEARER_TOKEN (if it's still valid)
- ❌ Only regenerate ACCESS_TOKEN and ACCESS_TOKEN_SECRET

---

## 🔴 REDDIT API TOKENS (PRIORITY 2)

### Current Status:
❌ CLIENT_ID and CLIENT_SECRET are expired/invalid (401 error)

### How to Create Reddit App:

1. **Go to Reddit Apps:**
   - URL: https://www.reddit.com/prefs/apps
   - Log in as ModernBusinessMum

2. **Create New App:**
   - Scroll to bottom
   - Click "create another app..."
   - Fill in form:
     - **Name:** Modern Business Mum Bot
     - **App type:** Select "script"
     - **Description:** Automated posting bot for Modern Business Mum
     - **About URL:** https://modernbusinessmum.com
     - **Redirect URI:** http://localhost:8000 (required but not used)

3. **Get Credentials:**
   - After creating, you'll see:
     - **CLIENT_ID:** 14-character string under app name
     - **CLIENT_SECRET:** longer string labeled "secret"
   - Copy both immediately

4. **Update .env File:**
   ```bash
   REDDIT_CLIENT_ID=<paste_client_id_here>
   REDDIT_CLIENT_SECRET=<paste_client_secret_here>
   REDDIT_USERNAME=ModernBusinessMum
   REDDIT_PASSWORD=Modernmummy2026!
   ```

5. **Test Connection:**
   ```bash
   node -e "
   import('snoowrap').then(async (snoowrap) => {
     const reddit = new snoowrap.default({
       userAgent: 'Modern Business Mum Bot v1.0.0',
       clientId: process.env.REDDIT_CLIENT_ID,
       clientSecret: process.env.REDDIT_CLIENT_SECRET,
       username: process.env.REDDIT_USERNAME,
       password: process.env.REDDIT_PASSWORD
     });
     const me = await reddit.getMe();
     console.log('✅ Reddit connected:', me.name);
   }).catch(console.error);
   "
   ```

---

## 📌 PINTEREST API TOKEN (OPTIONAL - IF NEEDED)

### Current Status:
❌ May need refresh (got 401 error earlier)

### How to Refresh:

1. **Go to Pinterest Developers:**
   - URL: https://developers.pinterest.com/apps/
   - Log in with your Pinterest business account

2. **Select Your App:**
   - Find "Modern Business Mum" app
   - Click to open

3. **Get Access Token:**
   - Go to "OAuth" or "Access Tokens" section
   - Generate new access token
   - Copy immediately

4. **Update .env File:**
   ```bash
   PINTEREST_ACCESS_TOKEN=<paste_new_token_here>
   PINTEREST_BOARD_ID=859765453803417177
   ```

---

## ✅ TOKENS THAT ARE WORKING

These don't need regeneration:

- ✅ **Supabase:** Connected and working
- ✅ **Anthropic Claude:** Connected and working
- ✅ **Stripe:** Connected and working
- ✅ **Resend Email:** Connected and working
- ✅ **YouTube:** Has refresh token (should auto-refresh)
- ✅ **Gumroad:** Working
- ✅ **Perplexity:** Working
- ✅ **OpenAI:** Working
- ✅ **Printful:** Working

---

## 🔒 SECURITY BEST PRACTICES

### When Regenerating Tokens:

1. **Never Share Publicly:**
   - Don't commit to git
   - Don't post in public channels
   - .env file is gitignored (safe)

2. **Copy Immediately:**
   - Most tokens only shown once
   - Use password manager if needed
   - Test immediately after updating

3. **Rotate Regularly:**
   - Regenerate tokens every 90 days
   - Set calendar reminder
   - Update documentation

4. **Test After Updates:**
   - Always run test scripts
   - Verify automation works
   - Check rate limits

---

## 📋 REGENERATION CHECKLIST

### Twitter:
- [ ] Go to developer.twitter.com portal
- [ ] Select app
- [ ] Navigate to "Keys and tokens"
- [ ] Regenerate Access Token & Secret
- [ ] Update .env with new tokens
- [ ] Run: `node scripts/test-twitter-auth.js`
- [ ] Verify: Should see "✅ Authenticated as @ModernBusinessMum"

### Reddit:
- [ ] Go to reddit.com/prefs/apps
- [ ] Create new app (type: script)
- [ ] Copy CLIENT_ID (14 chars under app name)
- [ ] Copy CLIENT_SECRET (longer string)
- [ ] Update .env with credentials
- [ ] Test connection
- [ ] Verify: Should see "✅ Reddit connected: ModernBusinessMum"

### Pinterest (if needed):
- [ ] Go to developers.pinterest.com
- [ ] Select app
- [ ] Generate new access token
- [ ] Update .env
- [ ] Test with legal-traffic-engine

---

## 🚨 TROUBLESHOOTING

### If Tokens Still Don't Work After Regeneration:

**For Twitter:**
1. Check app permissions (should be "Read and Write")
2. Ensure you have Elevated access (not just Essential)
3. Verify app is not suspended
4. Try regenerating again (tokens can fail first time)

**For Reddit:**
1. Ensure app type is "script" (not web app)
2. Verify redirect URI is set (even if unused)
3. Check username/password are correct
4. Try creating entirely new app

**For Pinterest:**
1. Verify business account is active
2. Check board ID is correct
3. Ensure board exists and you own it
4. Try regenerating token

---

## 📞 SUPPORT RESOURCES

- **Twitter Developer Docs:** https://developer.twitter.com/en/docs
- **Reddit API Docs:** https://www.reddit.com/dev/api
- **Pinterest API Docs:** https://developers.pinterest.com/docs/
- **Twitter Support:** https://developer.twitter.com/en/support
- **Reddit Support:** https://www.reddit.com/r/redditdev

---

## ⏱️ NEXT STEPS

**RIGHT NOW:**
1. Regenerate Twitter tokens (highest priority)
2. Test Twitter connection
3. Regenerate Reddit tokens
4. Test Reddit connection
5. Run first automated campaign

**ESTIMATED TIME:** 15 minutes total

**AFTER REGENERATION:**
- Run: `node scripts/track-revenue.js` to verify everything works
- Test campaign: `node agents/legal-traffic-engine.js`
- Launch Day 1 campaign

---

**🎯 GOAL: Get automation working so you can post Day 1 content automatically instead of manually.**
