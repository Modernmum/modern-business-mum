# Connect modernbusinessmum.com to Vercel

## Step 1: Add Domain in Vercel

1. Go to https://vercel.com/modern-business-mum
2. Click **Settings** (top navigation)
3. Click **Domains** (left sidebar)
4. In the "Add Domain" field, enter: `modernbusinessmum.com`
5. Click **Add**
6. Also add: `www.modernbusinessmum.com`
7. Click **Add**

Vercel will show you DNS configuration instructions.

## Step 2: Update DNS Records

Go to wherever you bought modernbusinessmum.com (Namecheap, GoDaddy, etc.) and add these DNS records:

### For Root Domain (modernbusinessmum.com):

**Type:** A
**Name:** @ (or leave blank)
**Value:** `76.76.21.21`
**TTL:** Automatic (or 3600)

### For WWW Subdomain (www.modernbusinessmum.com):

**Type:** CNAME
**Name:** www
**Value:** `cname.vercel-dns.com`
**TTL:** Automatic (or 3600)

## Step 3: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually it's **15-30 minutes**
- Check status at: https://dnschecker.org/#A/modernbusinessmum.com

## Step 4: Verify in Vercel

1. Go back to Vercel → Settings → Domains
2. You should see both domains with green checkmarks ✓
3. If you see warnings, click **Refresh** and wait a bit longer

## Step 5: Set Primary Domain

1. In Vercel Domains settings, click the **⋮** menu next to `modernbusinessmum.com`
2. Select **Set as Primary Domain**
3. This makes it the canonical URL

## Common DNS Providers

### Namecheap:
1. Advanced DNS → Add New Record
2. Type: A Record, Host: @, Value: 76.76.21.21
3. Type: CNAME, Host: www, Value: cname.vercel-dns.com

### GoDaddy:
1. DNS Management → Add
2. Type: A, Name: @, Value: 76.76.21.21
3. Type: CNAME, Name: www, Value: cname.vercel-dns.com

### Cloudflare:
1. DNS → Add record
2. Type: A, Name: @, IPv4: 76.76.21.21, Proxy: OFF (gray cloud)
3. Type: CNAME, Name: www, Target: cname.vercel-dns.com, Proxy: OFF

**IMPORTANT:** If using Cloudflare, turn OFF the proxy (gray cloud) initially to test.

## What Happens Next

Once DNS propagates:

✅ modernbusinessmum.com → redirects to www.modernbusinessmum.com
✅ www.modernbusinessmum.com → your storefront
✅ HTTPS automatically enabled by Vercel
✅ All Stripe checkout links will work with custom domain

## Verification

Test your domain:
```bash
# Check if DNS is pointed correctly
dig modernbusinessmum.com
dig www.modernbusinessmum.com

# Should show Vercel's IP: 76.76.21.21
```

Or visit: https://modernbusinessmum.com

You should see your Template Studio storefront!

## Troubleshooting

**Domain shows "Invalid Configuration":**
- Double-check DNS records are exact
- Wait longer (up to 24 hours)
- Try removing and re-adding domain in Vercel

**HTTPS not working:**
- Vercel auto-provisions SSL (takes 5-10 min after DNS works)
- If it fails, try: Settings → Domains → Refresh SSL

**www not working:**
- Make sure CNAME is `cname.vercel-dns.com` (not your Vercel URL)
- Check TTL isn't too high (use 3600)

## After Setup

Update your `.env` if needed:
```bash
PUBLIC_URL=https://modernbusinessmum.com
```

Then redeploy:
```bash
npx vercel --prod
```

---

Need help? Check Vercel docs: https://vercel.com/docs/concepts/projects/domains
