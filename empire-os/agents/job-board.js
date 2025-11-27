/**
 * AUTOMATED JOB BOARD
 * Scrapes job postings from multiple sources, auto-populates niche job board, companies pay to feature
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Scrape jobs from Indeed
const scrapeIndeed = async (jobTitle, location, maxResults = 20) => {
  console.log(`\n🔍 Scraping Indeed for "${jobTitle}" in ${location}...\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const query = `https://www.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location)}`;
  await page.goto(query, { waitUntil: 'networkidle2' });

  await page.waitForTimeout(2000);

  const jobs = await page.evaluate((max) => {
    const results = [];
    const jobCards = document.querySelectorAll('.job_seen_beacon, .jobsearch-SerpJobCard, [data-jk]');

    jobCards.forEach((card, index) => {
      if (index >= max) return;

      const titleEl = card.querySelector('h2 a, .jobTitle a, [data-testid="job-title"]');
      const companyEl = card.querySelector('.companyName, [data-testid="company-name"]');
      const locationEl = card.querySelector('.companyLocation, [data-testid="text-location"]');
      const summaryEl = card.querySelector('.job-snippet, .summary');

      if (titleEl && companyEl) {
        results.push({
          title: titleEl.textContent.trim(),
          company: companyEl.textContent.trim(),
          location: locationEl ? locationEl.textContent.trim() : '',
          summary: summaryEl ? summaryEl.textContent.trim() : '',
          url: titleEl.href || '',
          source: 'Indeed'
        });
      }
    });

    return results;
  }, maxResults);

  await browser.close();

  console.log(`   Found ${jobs.length} jobs from Indeed`);
  return jobs;
};

// Scrape jobs from LinkedIn (Google search)
const scrapeLinkedInJobs = async (jobTitle, maxResults = 20) => {
  console.log(`\n🔍 Scraping LinkedIn for "${jobTitle}"...\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const query = `"${jobTitle}" site:linkedin.com/jobs`;
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`, { waitUntil: 'networkidle2' });

  await page.waitForTimeout(2000);

  const jobs = await page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('a[href*="linkedin.com/jobs"]');

    links.forEach(link => {
      const url = link.href;
      const text = link.textContent.trim();

      if (url && text && !results.find(r => r.url === url)) {
        // Extract basic info from search result text
        const parts = text.split('·');
        results.push({
          title: parts[0]?.trim() || text.substring(0, 100),
          company: parts[1]?.trim() || 'Company Name',
          location: parts[2]?.trim() || 'Remote',
          summary: '',
          url: url,
          source: 'LinkedIn'
        });
      }
    });

    return results.slice(0, 15);
  });

  await browser.close();

  console.log(`   Found ${jobs.length} jobs from LinkedIn`);
  return jobs;
};

// Scrape remote jobs from We Work Remotely, Remote.co
const scrapeRemoteJobs = async (category = 'Programming') => {
  console.log(`\n🔍 Scraping remote job boards for "${category}"...\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // We Work Remotely
  await page.goto('https://weworkremotely.com/categories/remote-programming-jobs', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const jobs = await page.evaluate(() => {
    const results = [];
    const jobListings = document.querySelectorAll('li.feature, article');

    jobListings.forEach(listing => {
      const titleEl = listing.querySelector('.title, h2 a');
      const companyEl = listing.querySelector('.company, .company-name');
      const regionEl = listing.querySelector('.region');

      if (titleEl) {
        results.push({
          title: titleEl.textContent.trim(),
          company: companyEl ? companyEl.textContent.trim() : 'Remote Company',
          location: regionEl ? regionEl.textContent.trim() : 'Remote',
          summary: '',
          url: titleEl.href || 'https://weworkremotely.com',
          source: 'WeWorkRemotely'
        });
      }
    });

    return results.slice(0, 10);
  });

  await browser.close();

  console.log(`   Found ${jobs.length} remote jobs`);
  return jobs;
};

// Enrich job posting with AI-generated description
const enrichJobPosting = async (job) => {
  const prompt = `Enhance this job posting with missing information:

Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Current Summary: ${job.summary || 'No description provided'}

Generate:
- Full job description (if missing): 150-200 words, professional, engaging
- Required skills (5-7 key skills)
- Salary range estimate (based on role and market)
- Job type (Full-time, Part-time, Contract)
- Experience level (Entry, Mid, Senior)
- Benefits (typical for this role)

Format as JSON:
{
  "description": "...",
  "skills": ["...", "..."],
  "salaryRange": "$80k-$120k",
  "jobType": "Full-time",
  "experienceLevel": "Mid-level",
  "benefits": ["...", "..."]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(message.content[0].text);
  } catch (error) {
    console.log(`   ⚠️  Enrichment failed: ${error.message}`);
    return {
      description: job.summary || 'Job description coming soon.',
      skills: [],
      salaryRange: 'Competitive',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      benefits: []
    };
  }
};

// Check for duplicates
const isDuplicate = async (job) => {
  const { data } = await supabase
    .from('job_postings')
    .select('id')
    .eq('title', job.title)
    .eq('company', job.company)
    .single();

  return !!data;
};

// Save job to database
const saveJob = async (job, enrichedData) => {
  const { data, error } = await supabase
    .from('job_postings')
    .insert([{
      title: job.title,
      company: job.company,
      location: job.location,
      description: enrichedData.description,
      skills: enrichedData.skills,
      salary_range: enrichedData.salaryRange,
      job_type: enrichedData.jobType,
      experience_level: enrichedData.experienceLevel,
      benefits: enrichedData.benefits,
      source_url: job.url,
      source_platform: job.source,
      status: 'published',
      featured: false, // Companies can pay to feature
      posted_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Main execution - populate job board
export const populateJobBoard = async (jobTitle = 'Software Engineer', location = 'Remote', maxJobs = 50) => {
  console.log('\n🚀 AUTOMATED JOB BOARD STARTING...\n');
  console.log(`Scraping: ${jobTitle} jobs in ${location}\n`);
  console.log(`Target: ${maxJobs} new listings\n`);

  const allJobs = [];
  const savedJobs = [];

  try {
    // 1. Scrape from multiple sources
    const [indeedJobs, linkedInJobs, remoteJobs] = await Promise.all([
      scrapeIndeed(jobTitle, location, 20),
      scrapeLinkedInJobs(jobTitle, 15),
      location.toLowerCase().includes('remote') ? scrapeRemoteJobs('Programming') : Promise.resolve([])
    ]);

    allJobs.push(...indeedJobs, ...linkedInJobs, ...remoteJobs);

    console.log(`\n📊 Total jobs scraped: ${allJobs.length}\n`);

    // 2. Process each job
    for (const job of allJobs.slice(0, maxJobs)) {
      console.log(`\n💼 Processing: ${job.title} at ${job.company}`);

      try {
        // Check for duplicates
        if (await isDuplicate(job)) {
          console.log(`   ⏭️  Skipped (duplicate)`);
          continue;
        }

        // Enrich with AI
        console.log(`   🤖 Enriching job details...`);
        const enrichedData = await enrichJobPosting(job);

        // Save to database
        const savedJob = await saveJob(job, enrichedData);
        console.log(`   ✅ Published! ID: ${savedJob.id}`);
        savedJobs.push(savedJob);

      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error(`\n❌ Scraping error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 JOB BOARD POPULATION COMPLETE\n`);
  console.log(`   Jobs scraped: ${allJobs.length}`);
  console.log(`   Jobs published: ${savedJobs.length}`);
  console.log(`   Duplicates skipped: ${allJobs.length - savedJobs.length}`);
  console.log('\n' + '='.repeat(80) + '\n');

  return savedJobs;
};

// Feature job (companies pay for this)
export const featureJob = async (jobId, durationDays = 30) => {
  const { data, error } = await supabase
    .from('job_postings')
    .update({
      featured: true,
      featured_until: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;

  console.log(`\n⭐ Job featured until ${new Date(data.featured_until).toDateString()}\n`);
  return data;
};

// Analytics - track job board performance
export const getJobBoardStats = async () => {
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('*');

  const { data: views } = await supabase
    .from('job_views')
    .select('*');

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*');

  const stats = {
    totalJobs: jobs?.length || 0,
    featuredJobs: jobs?.filter(j => j.featured).length || 0,
    totalViews: views?.length || 0,
    totalApplications: applications?.length || 0,
    avgViewsPerJob: jobs?.length > 0 ? (views?.length || 0) / jobs.length : 0,
    conversionRate: views?.length > 0 ? ((applications?.length || 0) / views.length * 100).toFixed(2) : 0
  };

  console.log('\n📊 JOB BOARD STATS\n');
  console.log(`   Total Jobs: ${stats.totalJobs}`);
  console.log(`   Featured Jobs: ${stats.featuredJobs}`);
  console.log(`   Total Views: ${stats.totalViews}`);
  console.log(`   Applications: ${stats.totalApplications}`);
  console.log(`   Avg Views/Job: ${stats.avgViewsPerJob.toFixed(1)}`);
  console.log(`   Conversion Rate: ${stats.conversionRate}%\n`);

  return stats;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const jobTitle = process.argv[2] || 'Software Engineer';
  const location = process.argv[3] || 'Remote';
  const maxJobs = parseInt(process.argv[4]) || 30;

  populateJobBoard(jobTitle, location, maxJobs)
    .then(jobs => {
      console.log(`\n✅ Published ${jobs.length} new job listings\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Job board population failed:', error);
      process.exit(1);
    });
}
