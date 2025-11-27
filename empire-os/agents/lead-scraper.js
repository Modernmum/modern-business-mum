/**
 * LEAD GENERATION ENGINE
 * Scrapes business directories, qualifies leads with AI, auto-sends outreach
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Scrape companies from Apollo.io, ZoomInfo alternatives (free sources)
const scrapeCompanies = async (industry, revenueMin) => {
  console.log(`\n🔍 Scraping ${industry} companies with $${revenueMin}M+ revenue...\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Scrape from Google Search (free alternative to paid databases)
  const query = `${industry} companies "$${revenueMin}M revenue" site:linkedin.com`;
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

  // Extract company LinkedIn profiles
  const companies = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a[href*="linkedin.com/company"]').forEach(link => {
      const url = link.href;
      const name = link.textContent.trim();
      if (name && url) results.push({ name, linkedinUrl: url });
    });
    return results.slice(0, 10); // Get 10 companies
  });

  await browser.close();

  console.log(`   Found ${companies.length} companies`);
  return companies;
};

// Enrich company data with AI
const enrichCompany = async (company) => {
  const prompt = `Research this company and extract key info:

Company: ${company.name}
LinkedIn: ${company.linkedinUrl}

Extract:
- Industry
- Estimated revenue (if mentioned)
- Number of employees
- Main products/services
- Pain points they likely have
- Decision maker role (who would buy our services)

Format as JSON:
{
  "industry": "...",
  "revenue": "...",
  "employees": "...",
  "products": "...",
  "painPoints": ["..."],
  "decisionMaker": "..."
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return JSON.parse(message.content[0].text);
};

// AI qualification
const qualifyLead = async (company, enrichedData) => {
  const prompt = `Score this lead for our AI automation services (0-100):

Company: ${company.name}
Industry: ${enrichedData.industry}
Revenue: ${enrichedData.revenue}
Employees: ${enrichedData.employees}
Pain Points: ${enrichedData.painPoints.join(', ')}

Our services:
- AI content generation
- Lead generation automation
- Social media management
- SEO automation

Score criteria:
- Revenue $3M+: +40 points
- 15+ employees: +20 points
- Tech-savvy industry: +20 points
- Clear pain points: +20 points

Return just the score (0-100) and brief reason.

Format as JSON:
{"score": 85, "reason": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return JSON.parse(message.content[0].text);
};

// Generate personalized outreach email
const generateOutreach = async (company, enrichedData) => {
  const prompt = `Write a personalized cold email to ${company.name}.

Company details:
- Industry: ${enrichedData.industry}
- Pain points: ${enrichedData.painPoints.join(', ')}
- Decision maker: ${enrichedData.decisionMaker}

Our offer: AI-powered automation services that help ${enrichedData.industry} companies:
- Generate content automatically
- Automate lead generation
- Scale social media
- Improve SEO

Requirements:
- Personalized to their industry
- Mention specific pain point
- Clear value proposition
- Soft CTA (book 15-min call)
- Max 150 words
- Professional but conversational

Format as JSON:
{"subject": "...", "body": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return JSON.parse(message.content[0].text);
};

// Save lead to database
const saveLead = async (company, enrichedData, qualification, outreach) => {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      company_name: company.name,
      linkedin_url: company.linkedinUrl,
      industry: enrichedData.industry,
      revenue: enrichedData.revenue,
      employees: enrichedData.employees,
      pain_points: enrichedData.painPoints,
      qualification_score: qualification.score,
      qualification_reason: qualification.reason,
      outreach_subject: outreach.subject,
      outreach_body: outreach.body,
      status: qualification.score >= 70 ? 'qualified' : 'unqualified',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Main execution
export const runLeadGeneration = async (industry = 'SaaS', revenueMin = 3) => {
  console.log('\n🚀 LEAD GENERATION ENGINE STARTING...\n');
  console.log(`Target: ${industry} companies with $${revenueMin}M+ revenue\n`);

  // 1. Scrape companies
  const companies = await scrapeCompanies(industry, revenueMin);

  const qualifiedLeads = [];

  // 2. Process each company
  for (const company of companies) {
    console.log(`\n📊 Processing: ${company.name}`);

    try {
      // Enrich data
      const enrichedData = await enrichCompany(company);
      console.log(`   Industry: ${enrichedData.industry}`);

      // Qualify
      const qualification = await qualifyLead(company, enrichedData);
      console.log(`   Score: ${qualification.score}/100`);

      if (qualification.score >= 70) {
        // Generate outreach
        const outreach = await generateOutreach(company, enrichedData);
        console.log(`   ✅ Qualified! Email ready`);

        // Save to database
        const lead = await saveLead(company, enrichedData, qualification, outreach);
        qualifiedLeads.push(lead);
      } else {
        console.log(`   ❌ Not qualified: ${qualification.reason}`);
      }

    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Rate limit pause
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 LEAD GENERATION COMPLETE\n`);
  console.log(`   Total scraped: ${companies.length}`);
  console.log(`   Qualified: ${qualifiedLeads.length}`);
  console.log(`   Qualification rate: ${((qualifiedLeads.length / companies.length) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(80) + '\n');

  return qualifiedLeads;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const industry = process.argv[2] || 'SaaS';
  const revenueMin = process.argv[3] || 3;

  runLeadGeneration(industry, revenueMin)
    .then(leads => {
      console.log(`\n✅ Generated ${leads.length} qualified leads\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Lead generation failed:', error);
      process.exit(1);
    });
}
