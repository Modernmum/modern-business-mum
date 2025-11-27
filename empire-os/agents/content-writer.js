/**
 * AUTOMATED CONTENT AGENCY
 * Writes SEO blog posts, publishes to client sites, manages content calendar
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate SEO keywords for topic
const generateKeywords = async (topic, industry) => {
  const prompt = `Generate 10 high-value SEO keywords for this topic:

Topic: ${topic}
Industry: ${industry}

Requirements:
- Mix of short-tail and long-tail
- Commercial intent
- Realistic search volume
- Low competition

Return as JSON array: ["keyword1", "keyword2", ...]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Generate complete blog post
const generateBlogPost = async (topic, keywords, industry) => {
  const prompt = `Write a comprehensive, SEO-optimized blog post:

Topic: ${topic}
Target Keywords: ${keywords.join(', ')}
Industry: ${industry}

Requirements:
- 1500-2000 words
- Conversational but professional tone
- Include H2 and H3 headings
- Naturally integrate keywords
- Actionable tips
- Strong intro hook
- Clear CTA at end
- Format in Markdown

Write the complete blog post now.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text;
};

// Generate meta description
const generateMetaData = async (blogPost, keywords) => {
  const prompt = `Create SEO metadata for this blog post:

Blog post (first 500 chars): ${blogPost.substring(0, 500)}...

Target keywords: ${keywords.slice(0, 3).join(', ')}

Generate:
- SEO title (55-60 chars)
- Meta description (150-160 chars)
- Focus keyword

Format as JSON:
{"title": "...", "description": "...", "focusKeyword": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
};

// Save to database
const saveContent = async (clientId, topic, keywords, blogPost, metaData) => {
  const { data, error } = await supabase
    .from('content')
    .insert([{
      client_id: clientId,
      type: 'blog_post',
      topic,
      keywords,
      content: blogPost,
      seo_title: metaData.title,
      meta_description: metaData.description,
      focus_keyword: metaData.focusKeyword,
      status: 'draft',
      word_count: blogPost.split(' ').length,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Main content generation
export const generateContent = async (clientId, topic, industry) => {
  console.log('\n📝 CONTENT WRITER STARTING...\n');
  console.log(`Client: ${clientId}`);
  console.log(`Topic: ${topic}`);
  console.log(`Industry: ${industry}\n`);

  try {
    // 1. Generate keywords
    console.log('🔍 Generating SEO keywords...');
    const keywords = await generateKeywords(topic, industry);
    console.log(`   ✅ Generated ${keywords.length} keywords`);

    // 2. Write blog post
    console.log('\n✍️  Writing blog post...');
    const blogPost = await generateBlogPost(topic, keywords, industry);
    const wordCount = blogPost.split(' ').length;
    console.log(`   ✅ ${wordCount} words written`);

    // 3. Generate metadata
    console.log('\n🎯 Generating SEO metadata...');
    const metaData = await generateMetaData(blogPost, keywords);
    console.log(`   ✅ Title: ${metaData.title}`);
    console.log(`   ✅ Focus keyword: ${metaData.focusKeyword}`);

    // 4. Save to database
    console.log('\n💾 Saving to database...');
    const content = await saveContent(clientId, topic, keywords, blogPost, metaData);
    console.log(`   ✅ Saved with ID: ${content.id}`);

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ CONTENT GENERATION COMPLETE\n`);
    console.log(`   Word count: ${wordCount}`);
    console.log(`   Keywords: ${keywords.length}`);
    console.log(`   Status: Ready to publish`);
    console.log('\n' + '='.repeat(80) + '\n');

    return content;

  } catch (error) {
    console.error('\n❌ Content generation failed:', error);
    throw error;
  }
};

// Batch content generation for multiple clients
export const runContentAgency = async () => {
  console.log('\n🚀 AUTOMATED CONTENT AGENCY STARTING...\n');

  // Get all active clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('service', 'content_agency')
    .eq('status', 'active');

  if (!clients || clients.length === 0) {
    console.log('No active content clients found.\n');
    return;
  }

  console.log(`📊 Found ${clients.length} active clients\n`);

  const results = [];

  for (const client of clients) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\nProcessing: ${client.company_name}\n`);

    // Generate content based on client's calendar
    const topics = client.content_topics || ['Industry trends', 'Best practices', 'How-to guide'];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    try {
      const content = await generateContent(client.id, topic, client.industry);
      results.push({ client: client.company_name, success: true, contentId: content.id });
    } catch (error) {
      results.push({ client: client.company_name, success: false, error: error.message });
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 CONTENT AGENCY RUN COMPLETE\n`);
  console.log(`   Clients processed: ${clients.length}`);
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  console.log('\n' + '='.repeat(80) + '\n');

  return results;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const clientId = process.argv[2] || 'demo-client';
  const topic = process.argv[3] || 'How to scale your business with AI automation';
  const industry = process.argv[4] || 'SaaS';

  generateContent(clientId, topic, industry)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
