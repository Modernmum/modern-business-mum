# 🐦 TWITTER AUTOMATION COMPLIANCE RULES

**Last Updated:** November 28, 2025
**Status:** Using Official Twitter API v2
**Account:** @ModernBusinessMum

---

## ✅ WHAT WE'RE ALLOWED TO DO

### 1. **Posting Tweets (Official API)**
- ✅ Post individual tweets via API
- ✅ Post threads (reply to own tweets)
- ✅ Schedule posts using API
- ✅ Delete own tweets
- ✅ Retweet content

### 2. **Rate Limits (MUST RESPECT)**
- **Tweet creation:** 300 tweets per 3-hour window
- **Our limit:** 5 tweets per campaign (well under limit)
- **Campaign frequency:** Max 3 campaigns per day = 15 tweets/day
- **Safety margin:** 20x under the limit

### 3. **Content Rules**
- ✅ Original content (AI-generated is allowed)
- ✅ Value-focused threads
- ✅ Links to our own content (modernbusinessmum.com)
- ✅ Relevant hashtags (2-3 per thread)
- ✅ Clear business purpose

---

## ❌ WHAT WILL GET US BLOCKED

### 1. **NEVER Do These:**
- ❌ Mass follows/unfollows
- ❌ Mass unsolicited mentions (@username spam)
- ❌ Automated DMs to strangers
- ❌ Aggressive follow/unfollow patterns
- ❌ Bulk likes/retweets (above rate limits)
- ❌ Duplicate content across multiple accounts
- ❌ Same tweet posted repeatedly

### 2. **Spam Indicators:**
- ❌ Posting same content multiple times
- ❌ Excessive hashtags (>3-4)
- ❌ URL shorteners that hide destination
- ❌ Misleading or clickbait content
- ❌ Posting too frequently (>50 tweets/day)

### 3. **Engagement Automation:**
- ❌ Auto-follow everyone who follows you
- ❌ Auto-like tweets based on keywords
- ❌ Auto-retweet without review
- ❌ Engagement pods/groups

---

## 🛡️ OUR COMPLIANCE STRATEGY

### Daily Posting Pattern:
```
Morning (10 AM):   1 thread (4-5 tweets)
Afternoon (2 PM):  Optional - only if relevant news
Evening (6 PM):    Optional - engagement/replies

Max: 3 threads/day = 15 tweets/day (5% of limit)
```

### Content Quality Checklist:
- [ ] AI-generated but reviewed for quality
- [ ] Provides genuine value to audience
- [ ] No duplicate content
- [ ] Links to our own domain
- [ ] 2-3 relevant hashtags max
- [ ] Clear business context
- [ ] No misleading claims

### Thread Structure (Our Standard):
```
Tweet 1: Hook/Problem (280 chars)
Tweet 2: Context/Data (280 chars)
Tweet 3: Solution/Value (280 chars)
Tweet 4: CTA with link (280 chars)
```

---

## 🔍 MONITORING FOR SAFETY

### Red Flags to Watch:
1. **Engagement drop** - Could indicate shadow ban
2. **Tweets not appearing in search** - Possible filter
3. **Replies not showing up** - Quality filter active
4. **Followers not seeing tweets** - Reach limited

### If We Get Rate Limited:
1. **Stop immediately** - Respect the limit
2. **Wait for reset** - Rate limits reset every 3 hours
3. **Reduce frequency** - Scale back posting
4. **Review compliance** - Check what triggered it

### If We Get Suspended:
1. **Do NOT create new account** - Ban evasion = permanent ban
2. **Appeal via Twitter Support** - Explain legitimate business use
3. **Provide context** - Show we use official API
4. **Wait for review** - Can take 3-7 days

---

## 📊 SAFE AUTOMATION IMPLEMENTATION

### Current Implementation (legal-traffic-engine.js):

```javascript
// ✅ SAFE: Using official Twitter API v2
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// ✅ SAFE: Posting thread with replies
for (const tweet of content.twitter_thread) {
  const response = await rwClient.v2.tweet({
    text: tweet,
    ...(lastTweetId && { reply: { in_reply_to_tweet_id: lastTweetId } }),
  });
  lastTweetId = response.data.id;
}

// ✅ SAFE: 5-minute delay between campaigns
await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
```

### What Makes This Safe:
1. ✅ Official API v2 (not scraping or browser automation)
2. ✅ Low volume (3 campaigns/day = 15 tweets)
3. ✅ Clear delays (5 min between campaigns)
4. ✅ Unique content each time (AI-generated)
5. ✅ Business purpose (not spam)
6. ✅ Own domain links (modernbusinessmum.com)

---

## 🚨 EMERGENCY PROCEDURES

### If Tweets Are Getting Flagged:
1. **Pause automation immediately**
2. **Review last 10 tweets for compliance**
3. **Delete any problematic content**
4. **Wait 24 hours before resuming**
5. **Adjust content strategy**

### If Account Gets Restricted:
1. **Stop all automation**
2. **Document what happened**
3. **File appeal through Twitter Support**
4. **Explain legitimate business use**
5. **Show compliance with automation rules**

### If Rate Limit Hit:
1. **System automatically handles** (API returns 429 error)
2. **Wait for reset** (3-hour window)
3. **Log the incident**
4. **Review posting frequency**

---

## 📋 PRE-FLIGHT CHECKLIST

Before every automated campaign:
- [ ] Content is unique (not posted before)
- [ ] Value-focused (helps audience)
- [ ] 2-3 hashtags max
- [ ] Links to our own domain
- [ ] Under 5 tweets in thread
- [ ] 5+ minutes since last campaign
- [ ] Under 50 tweets today
- [ ] No unsolicited mentions
- [ ] Clear business context

---

## 🎯 BEST PRACTICES

### Do This:
- ✅ Post 1-3 times per day
- ✅ Engage manually with replies
- ✅ Share valuable content
- ✅ Use official API
- ✅ Respect rate limits
- ✅ Build genuine audience
- ✅ Mix automation with manual tweets

### Don't Do This:
- ❌ Post more than 50 times/day
- ❌ Use third-party growth tools
- ❌ Buy followers/engagement
- ❌ Post duplicate content
- ❌ Auto-follow aggressively
- ❌ Send automated DMs
- ❌ Use hashtag spam

---

## 📚 OFFICIAL TWITTER RULES REFERENCES

1. **Twitter Automation Rules:** https://help.twitter.com/en/rules-and-policies/twitter-automation
2. **Developer Agreement:** https://developer.twitter.com/en/developer-terms/agreement-and-policy
3. **API Rate Limits:** https://developer.twitter.com/en/docs/twitter-api/rate-limits
4. **Platform Manipulation Policy:** https://help.twitter.com/en/rules-and-policies/platform-manipulation

---

## ✅ COMPLIANCE CERTIFICATION

**Current Status:** FULLY COMPLIANT

- ✅ Using Twitter API v2
- ✅ Under rate limits (5% utilization)
- ✅ Unique, valuable content
- ✅ No spam indicators
- ✅ No mass automation
- ✅ Clear business purpose
- ✅ Following all official rules

**Last Review:** November 28, 2025
**Next Review:** December 1, 2025
**Reviewed By:** AI Operations Team

---

**REMEMBER: When in doubt, DON'T automate it. Manual posting is always safer than risking account suspension.**
