/**
 * SEO CONTENT MACHINE
 * Auto-generates and publishes SEO-optimized blog posts
 * Drives Google traffic to YOUR site (not someone else's platform)
 * Builds YOUR audience, YOUR email list, YOUR revenue
 */

import { getProducts } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate SEO-optimized blog post for a product
 */
const generateSEOBlogPost = async (product) => {
  console.log(`\n📝 Generating SEO content for: ${product.title}`);

  const prompt = `You are an expert SEO content writer. Create a comprehensive blog post that will rank on Google and drive traffic.

PRODUCT: ${product.title}
CATEGORY: ${product.niche}
DESCRIPTION: ${product.description}

Create a blog post with:
1. SEO Title (60 chars, includes target keyword)
2. Meta Description (155 chars, compelling + keyword)
3. Target Keywords (5-7 keywords people search on Google)
4. Full Blog Post (1500-2000 words)

The blog post should:
- Hook readers in the first paragraph with their pain point
- Provide genuine value (not just selling)
- Include sections: Problem, Solution, How It Works, Benefits, FAQ
- Naturally mention the Notion template as a solution
- End with clear CTA to view the template
- Use conversational, helpful tone
- Include internal link opportunities

Output as JSON:
{
  "seoTitle": "Title here",
  "metaDescription": "Description here",
  "targetKeywords": ["keyword1", "keyword2", ...],
  "slug": "url-friendly-slug",
  "content": "Full markdown blog post here with ## headers",
  "ctaText": "Call to action text",
  "ctaLink": "/shop/product-slug"
}`;

  const result = await generateText(prompt, 'json');

  console.log(`✅ Generated ${result.content.length} chars`);
  console.log(`   Keywords: ${result.targetKeywords.join(', ')}`);

  return result;
};

/**
 * Save blog post as HTML file
 */
const saveBlogPost = async (blogData, product) => {
  const blogDir = path.join(__dirname, '..', 'public', 'blog');
  await fs.mkdir(blogDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogData.seoTitle}</title>
    <meta name="description" content="${blogData.metaDescription}">
    <meta name="keywords" content="${blogData.targetKeywords.join(', ')}">

    <!-- Open Graph -->
    <meta property="og:title" content="${blogData.seoTitle}">
    <meta property="og:description" content="${blogData.metaDescription}">
    <meta property="og:type" content="article">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.8;
            color: #2d3748;
            background: #f7fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: white;
            min-height: 100vh;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            color: #1a202c;
            line-height: 1.2;
        }
        h2 {
            font-size: 1.8rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #2d3748;
        }
        p {
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
        }
        .cta {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin: 3rem 0;
        }
        .cta h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .cta a {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
            transition: transform 0.2s;
        }
        .cta a:hover {
            transform: translateY(-2px);
        }
        .keywords {
            background: #edf2f7;
            padding: 1rem;
            border-radius: 8px;
            margin: 2rem 0;
            font-size: 0.9rem;
            color: #4a5568;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${blogData.seoTitle}</h1>

        <div class="keywords">
            <strong>Topics:</strong> ${blogData.targetKeywords.join(' • ')}
        </div>

        ${blogData.content.split('\n').map(line => {
          if (line.startsWith('## ')) {
            return `<h2>${line.replace('## ', '')}</h2>`;
          } else if (line.trim()) {
            return `<p>${line}</p>`;
          }
          return '';
        }).join('\n')}

        <div class="cta">
            <h3>${blogData.ctaText}</h3>
            <a href="${blogData.ctaLink}">View Template →</a>
        </div>

        <p style="text-align: center; color: #718096; margin-top: 3rem;">
            <a href="/blog" style="color: #667eea;">← Back to Blog</a> |
            <a href="/shop" style="color: #667eea;">Browse Templates</a>
        </p>
    </div>
</body>
</html>`;

  const filePath = path.join(blogDir, `${blogData.slug}.html`);
  await fs.writeFile(filePath, html);

  console.log(`💾 Saved to: /blog/${blogData.slug}.html`);

  return `/blog/${blogData.slug}.html`;
};

/**
 * Generate blog index page
 */
const generateBlogIndex = async (blogPosts) => {
  const blogDir = path.join(__dirname, '..', 'public', 'blog');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notion Template Guides & Tutorials | Modern Business Mum</title>
    <meta name="description" content="Expert guides on productivity, business templates, and workflow optimization using Notion.">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #f7fafc;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .container { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }
        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
        }
        .post-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .post-card:hover { transform: translateY(-4px); }
        .post-card h2 { color: #667eea; margin-bottom: 1rem; font-size: 1.5rem; }
        .post-card p { color: #4a5568; margin-bottom: 1rem; }
        .post-card a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>📚 Notion Mastery Blog</h1>
        <p>Expert guides to transform your productivity</p>
    </div>

    <div class="container">
        <div class="posts-grid">
            ${blogPosts.map(post => `
                <div class="post-card">
                    <h2>${post.title}</h2>
                    <p>${post.description}</p>
                    <a href="${post.url}">Read More →</a>
                </div>
            `).join('\n')}
        </div>
    </div>
</body>
</html>`;

  await fs.writeFile(path.join(blogDir, 'index.html'), html);
  console.log(`\n📄 Generated blog index with ${blogPosts.length} posts`);
};

/**
 * Run SEO Content Machine
 */
const runSEOContentMachine = async (limit = 10) => {
  console.log('\n🚀 SEO CONTENT MACHINE\n');
  console.log('Strategy: Own the traffic, own the customer, own the revenue\n');

  // Get top products
  const products = await getProducts({ status: 'listed', limit });

  console.log(`📊 Generating SEO content for ${products.length} products\n`);

  const blogPosts = [];

  for (const product of products) {
    try {
      const blogData = await generateSEOBlogPost(product);
      const url = await saveBlogPost(blogData, product);

      blogPosts.push({
        title: blogData.seoTitle,
        description: blogData.metaDescription,
        url: url,
        keywords: blogData.targetKeywords,
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed for ${product.title}:`, error.message);
    }
  }

  // Generate blog index
  await generateBlogIndex(blogPosts);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ SEO CONTENT MACHINE COMPLETE\n');
  console.log(`📝 Generated: ${blogPosts.length} blog posts`);
  console.log(`🎯 Target Keywords: ${blogPosts.reduce((acc, p) => acc + p.keywords.length, 0)} total`);
  console.log(`📍 Published to: /public/blog/`);
  console.log(`🔍 Google will index these pages and drive FREE organic traffic`);
  console.log(`💰 Traffic → YOUR site → YOUR email list → YOUR revenue`);
  console.log('\n' + '='.repeat(80));

  return blogPosts;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSEOContentMachine(10)
    .then(() => {
      console.log('\n✅ Complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { runSEOContentMachine, generateSEOBlogPost };
