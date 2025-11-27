/**
 * COLD EMAIL OUTREACH AUTOMATION
 * Scrapes LinkedIn for prospects, AI writes personalized emails, auto-follow-ups
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// Scrape LinkedIn for prospects
const scrapeLinkedInProspects = async (jobTitle, industry, location = 'United States') => {
  console.log(`\n🔍 Scraping LinkedIn for ${jobTitle} in ${industry}...\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Use Google to find LinkedIn profiles (free alternative to LinkedIn Sales Navigator)
  const query = `"${jobTitle}" "${industry}" site:linkedin.com/in ${location}`;
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`);

  await page.waitForTimeout(2000);

  const prospects = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a[href*="linkedin.com/in/"]').forEach(link => {
      const url = link.href;
      const text = link.textContent.trim();

      // Extract name from LinkedIn URL or link text
      const nameMatch = url.match(/linkedin\.com\/in\/([^/?]+)/);
      const urlSlug = nameMatch ? nameMatch[1] : '';
      const name = text.includes('LinkedIn') ? urlSlug.replace(/-/g, ' ') : text;

      if (name && url && !results.find(r => r.linkedinUrl === url)) {
        results.push({
          name: name.split('-')[0].trim(),
          linkedinUrl: url,
          title: '', // Will be enriched by AI
          company: '' // Will be enriched by AI
        });
      }
    });
    return results.slice(0, 15); // Get 15 prospects
  });

  await browser.close();

  console.log(`   Found ${prospects.length} prospects`);
  return prospects;
};

// Enrich prospect data with AI (scrape their LinkedIn via web search)
const enrichProspect = async (prospect) => {
  const prompt = `Based on this LinkedIn profile URL, infer typical information for someone in this role:

LinkedIn: ${prospect.linkedinUrl}
Name: ${prospect.name}

Extract/infer:
- Current job title (best guess)
- Current company (best guess from URL if visible)
- Industry they work in
- Likely pain points they have
- Best approach angle for cold outreach

Format as JSON:
{
  "title": "...",
  "company": "...",
  "industry": "...",
  "painPoints": ["...", "..."],
  "approachAngle": "..."
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Find prospect's email (basic pattern matching)
const findProspectEmail = async (prospect, enrichedData) => {
  // Common email patterns for B2B
  const company = enrichedData.company.toLowerCase().replace(/\s+/g, '');
  const firstName = prospect.name.split(' ')[0].toLowerCase();
  const lastName = prospect.name.split(' ').slice(-1)[0].toLowerCase();

  // Try common patterns (we'll verify later with email validation service)
  const patterns = [
    `${firstName}.${lastName}@${company}.com`,
    `${firstName}@${company}.com`,
    `${firstName[0]}${lastName}@${company}.com`,
    `${firstName}_${lastName}@${company}.com`
  ];

  // For now, return most common pattern (in production, use Hunter.io or similar)
  return patterns[0];
};

// Generate personalized cold email
const generateColdEmail = async (prospect, enrichedData) => {
  const prompt = `Write a highly personalized cold email to ${prospect.name}.

Prospect details:
- Name: ${prospect.name}
- Title: ${enrichedData.title}
- Company: ${enrichedData.company}
- Industry: ${enrichedData.industry}
- Pain points: ${enrichedData.painPoints.join(', ')}
- Best approach: ${enrichedData.approachAngle}

Our services (Empire OS):
- AI-powered lead generation
- Automated content creation
- Cold email outreach systems
- Social media automation
- SEO services

Requirements:
- Subject line that gets opened (personalized, intriguing)
- Opening line that's ULTRA specific to them (not generic)
- Mention one specific pain point
- Show we understand their world
- Clear value proposition (save time, increase revenue, scale faster)
- Soft CTA (15-min call or quick question)
- Max 120 words total
- Professional but conversational
- NO salesy language

Format as JSON:
{"subject": "...", "body": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Generate follow-up emails (sequence of 3)
const generateFollowUpSequence = async (prospect, enrichedData, initialEmail) => {
  const prompt = `Create a 3-email follow-up sequence for ${prospect.name}.

Initial email sent:
Subject: ${initialEmail.subject}
Body: ${initialEmail.body}

Create follow-ups that:
1. Follow-up #1 (3 days later): Add value, share relevant insight
2. Follow-up #2 (5 days later): Different angle, case study or social proof
3. Follow-up #3 (7 days later): Breakup email, last chance

Each should:
- Reference previous email naturally
- Add NEW value (tip, insight, resource)
- Different CTA approach
- Max 100 words each

Format as JSON array:
[
  {"dayDelay": 3, "subject": "...", "body": "..."},
  {"dayDelay": 5, "subject": "...", "body": "..."},
  {"dayDelay": 7, "subject": "...", "body": "..."}
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Send email via Resend
const sendEmail = async (to, subject, body) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Empire OS <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>') // Simple HTML conversion
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Save campaign to database
const saveCampaign = async (prospect, enrichedData, email, followUps, emailAddress, status) => {
  const { data, error } = await supabase
    .from('email_campaigns')
    .insert([{
      prospect_name: prospect.name,
      prospect_title: enrichedData.title,
      prospect_company: enrichedData.company,
      prospect_industry: enrichedData.industry,
      prospect_linkedin: prospect.linkedinUrl,
      prospect_email: emailAddress,
      initial_subject: email.subject,
      initial_body: email.body,
      follow_ups: followUps,
      status: status,
      emails_sent: status === 'sent' ? 1 : 0,
      created_at: new Date().toISOString(),
      next_followup_date: status === 'sent' ? new Date(Date.now() + followUps[0].dayDelay * 24 * 60 * 60 * 1000).toISOString() : null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Main execution
export const runColdEmailCampaign = async (jobTitle = 'CEO', industry = 'SaaS', sendEmails = false) => {
  console.log('\n🚀 COLD EMAIL OUTREACH ENGINE STARTING...\n');
  console.log(`Target: ${jobTitle}s in ${industry}\n`);
  console.log(`Mode: ${sendEmails ? 'LIVE (sending emails)' : 'TEST (draft only)'}\n`);

  // 1. Scrape prospects
  const prospects = await scrapeLinkedInProspects(jobTitle, industry);

  const campaigns = [];

  // 2. Process each prospect
  for (const prospect of prospects) {
    console.log(`\n📧 Processing: ${prospect.name}`);

    try {
      // Enrich data
      const enrichedData = await enrichProspect(prospect);
      console.log(`   Title: ${enrichedData.title} at ${enrichedData.company}`);

      // Find email
      const emailAddress = await findProspectEmail(prospect, enrichedData);
      console.log(`   Email: ${emailAddress}`);

      // Generate initial email
      const email = await generateColdEmail(prospect, enrichedData);
      console.log(`   Subject: ${email.subject}`);

      // Generate follow-up sequence
      const followUps = await generateFollowUpSequence(prospect, enrichedData, email);
      console.log(`   Follow-ups: ${followUps.length} emails queued`);

      // Send or save as draft
      let status = 'draft';
      if (sendEmails) {
        const result = await sendEmail(emailAddress, email.subject, email.body);
        if (result.success) {
          console.log(`   ✅ Email sent! (${result.messageId})`);
          status = 'sent';
        } else {
          console.log(`   ⚠️  Send failed: ${result.error}`);
          status = 'failed';
        }
      } else {
        console.log(`   📝 Saved as draft`);
      }

      // Save campaign
      const campaign = await saveCampaign(prospect, enrichedData, email, followUps, emailAddress, status);
      campaigns.push(campaign);

    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 COLD EMAIL CAMPAIGN COMPLETE\n`);
  console.log(`   Prospects processed: ${prospects.length}`);
  console.log(`   Campaigns created: ${campaigns.length}`);
  if (sendEmails) {
    console.log(`   Emails sent: ${campaigns.filter(c => c.status === 'sent').length}`);
    console.log(`   Failed: ${campaigns.filter(c => c.status === 'failed').length}`);
  } else {
    console.log(`   Mode: Draft only (set sendEmails=true to send)`);
  }
  console.log('\\n' + '='.repeat(80) + '\\n');

  return campaigns;
};

// Follow-up sender (run daily to send scheduled follow-ups)
export const sendScheduledFollowUps = async () => {
  console.log('\n📬 CHECKING FOR SCHEDULED FOLLOW-UPS...\n');

  const today = new Date().toISOString().split('T')[0];

  // Get campaigns with pending follow-ups
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'sent')
    .lte('next_followup_date', new Date().toISOString());

  if (!campaigns || campaigns.length === 0) {
    console.log('No follow-ups scheduled for today.\n');
    return;
  }

  console.log(`Found ${campaigns.length} follow-ups to send\n`);

  for (const campaign of campaigns) {
    const followUpIndex = campaign.emails_sent - 1; // 0-indexed
    if (followUpIndex >= campaign.follow_ups.length) {
      // Campaign complete
      await supabase
        .from('email_campaigns')
        .update({ status: 'completed' })
        .eq('id', campaign.id);
      continue;
    }

    const followUp = campaign.follow_ups[followUpIndex];

    console.log(`📧 Sending follow-up to ${campaign.prospect_name}...`);

    const result = await sendEmail(campaign.prospect_email, followUp.subject, followUp.body);

    if (result.success) {
      console.log(`   ✅ Sent! (${result.messageId})`);

      // Update campaign
      const nextIndex = followUpIndex + 1;
      const nextFollowUp = campaign.follow_ups[nextIndex];

      await supabase
        .from('email_campaigns')
        .update({
          emails_sent: campaign.emails_sent + 1,
          next_followup_date: nextFollowUp
            ? new Date(Date.now() + nextFollowUp.dayDelay * 24 * 60 * 60 * 1000).toISOString()
            : null
        })
        .eq('id', campaign.id);
    } else {
      console.log(`   ⚠️  Failed: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ Follow-up sender complete\n');
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const jobTitle = process.argv[2] || 'CEO';
  const industry = process.argv[3] || 'SaaS';
  const sendEmails = process.argv[4] === 'true'; // Safety: must explicitly enable

  runColdEmailCampaign(jobTitle, industry, sendEmails)
    .then(campaigns => {
      console.log(`\n✅ Created ${campaigns.length} email campaigns\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cold email campaign failed:', error);
      process.exit(1);
    });
}
