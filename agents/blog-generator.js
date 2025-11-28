/**
 * AUTOMATED BLOG GENERATOR
 * Creates SEO-optimized blog posts for products
 * Drives organic Google traffic to your shop
 * NO EXTERNAL APIS NEEDED - uses Perplexity which already works
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
const generateBlogPost = async (product) => {
  const prompt = `Write an SEO-optimized blog post about this Notion template product.

Product: ${product.title}
Category: ${product.niche}
Price: $${product.suggested_price}
Description: ${product.description}
Features: ${product.template_content?.features?.join(', ') || 'N/A'}

Create a 500-800 word blog post with:
1. SEO title (60 chars max)
2. Meta description (160 chars max)
3. Introduction paragraph (hook the reader)
4. "Why You Need This" section
5. "Key Features" section
6. "Who This Is For" section
7. Conclusion with call-to-action

Focus on benefits, pain points, and SEO keywords related to ${product.niche} and Notion templates.

Output as JSON:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "slug": "url-friendly-slug",
  "content": "Full blog post in markdown format"
}`;

  const response = await generateText(prompt, 'json');
  return response;
};

/**
 * Create HTML blog post file
 */
const createBlogPostFile = async (blogData, product) => {
  const buyLink = product.listings?.[0]?.url || `https://modernbusinessmum.com/shop`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogData.seoTitle}</title>
    <meta name="description" content="${blogData.metaDescription}">

    <!-- SEO Meta Tags -->
    <meta name="keywords" content="notion template, ${product.niche}, productivity, business tools">
    <meta name="author" content="Modern Business Mum">

    <!-- Open Graph -->
    <meta property="og:title" content="${blogData.seoTitle}">
    <meta property="og:description" content="${blogData.metaDescription}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://modernbusinessmum.com/blog/${blogData.slug}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${blogData.seoTitle}">
    <meta name="twitter:description" content="${blogData.metaDescription}">

    <link rel="stylesheet" href="/css/style.css">
    <style>
        .blog-post {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.8;
        }
        .blog-post h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #2d3748;
        }
        .blog-post .meta {
            color: #718096;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        .blog-post img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 2rem 0;
        }
        .cta-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin: 3rem 0;
        }
        .cta-box h3 {
            margin-top: 0;
            font-size: 1.8rem;
        }
        .cta-button {
            background: white;
            color: #667eea;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin-top: 1rem;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: scale(1.05);
        }
        .blog-content {
            font-size: 1.1rem;
            color: #4a5568;
        }
        .blog-content h2 {
            color: #2d3748;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .blog-content ul {
            margin: 1rem 0;
            padding-left: 2rem;
        }
        .blog-content li {
            margin: 0.5rem 0;
        }
    </style>
</head>
<body>
    <div class="blog-post">
        <h1>${product.title}</h1>
        <div class="meta">
            <span>Published: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span> •
            <span>Category: ${product.niche}</span>
        </div>

        <div class="blog-content">
            ${markdownToHtml(blogData.content)}
        </div>

        <div class="cta-box">
            <h3>Ready to transform your ${product.niche} workflow?</h3>
            <p>Get ${product.title} now for only $${product.suggested_price}</p>
            <a href="${buyLink}" class="cta-button">Get This Template Now</a>
        </div>

        <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <a href="/shop" style="color: #667eea; text-decoration: none;">← Back to Shop</a>
        </div>
    </div>
</body>
</html>`;

  const blogDir = path.join(__dirname, '..', 'public', 'blog');
  await fs.mkdir(blogDir, { recursive: true });

  const filePath = path.join(blogDir, `${blogData.slug}.html`);
  await fs.writeFile(filePath, html);

  return filePath;
};

/**
 * Simple markdown to HTML converter
 */
const markdownToHtml = (markdown) => {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gim, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h[123]><\/p>/g, '</h3>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>');
};

/**
 * Create blog index page
 */
const createBlogIndex = async (posts) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Notion Template Guides | Modern Business Mum</title>
    <meta name="description" content="Expert guides and tutorials for Notion templates to boost your productivity and business success.">
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .blog-index {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .blog-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        .blog-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .blog-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
        .blog-card h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #2d3748;
        }
        .blog-card .meta {
            color: #718096;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .blog-card p {
            color: #4a5568;
            line-height: 1.6;
        }
        .blog-card a {
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
        }
        .page-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .page-header h1 {
            font-size: 3rem;
            color: #2d3748;
        }
    </style>
</head>
<body>
    <div class="blog-index">
        <div class="page-header">
            <h1>Notion Template Guides</h1>
            <p>Expert tutorials to maximize your productivity</p>
        </div>

        <div class="blog-grid">
            ${posts.map(post => `
                <div class="blog-card">
                    <h2>${post.title}</h2>
                    <div class="meta">${post.category} • ${post.date}</div>
                    <p>${post.description}</p>
                    <a href="/blog/${post.slug}">Read More →</a>
                </div>
            `).join('')}
        </div>

        <div style="text-align: center; margin-top: 3rem;">
            <a href="/shop" style="color: #667eea; text-decoration: none;">← Back to Shop</a>
        </div>
    </div>
</body>
</html>`;

  const filePath = path.join(__dirname, '..', 'public', 'blog', 'index.html');
  await fs.writeFile(filePath, html);
};

/**
 * Main execution
 */
const runBlogGeneration = async () => {
  console.log('\n📝 AUTOMATED BLOG GENERATOR STARTING...\n');

  // Get products
  const allProducts = await getProducts({ status: 'listed', limit: 100 });

  // Generate for first 10 products
  const productsToWrite = allProducts.slice(0, 10);

  console.log(`📦 Found ${allProducts.length} products, generating blogs for ${productsToWrite.length}...\n`);

  const blogPosts = [];

  for (const product of productsToWrite) {
    console.log(`\n📝 Writing blog post: ${product.title}`);

    try {
      // Generate blog content
      const blogData = await generateBlogPost(product);

      // Create HTML file
      const filePath = await createBlogPostFile(blogData, product);

      console.log(`  ✅ Blog post created: /blog/${blogData.slug}.html`);

      blogPosts.push({
        title: blogData.seoTitle,
        slug: blogData.slug,
        description: blogData.metaDescription,
        category: product.niche,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      // Delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`  ❌ Error generating blog for ${product.title}:`, error.message);
    }
  }

  // Create blog index
  await createBlogIndex(blogPosts);
  console.log(`\n✅ Blog index created at /blog/index.html`);

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 BLOG GENERATION SUMMARY:\n');
  console.log(`✅ Successfully created: ${blogPosts.length}/${productsToWrite.length} blog posts`);
  console.log(`\n📍 View at: https://modernbusinessmum.com/blog`);
  console.log('\n🔍 SEO Impact:');
  console.log(`   - ${blogPosts.length} new indexed pages for Google`);
  console.log(`   - ${blogPosts.length} new keyword-optimized landing pages`);
  console.log(`   - Direct links to product checkout pages`);
  console.log('\n' + '='.repeat(80));

  return blogPosts;
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBlogGeneration()
    .then(() => {
      console.log('\n✅ Blog generation complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Blog generation failed:', error);
      process.exit(1);
    });
}

export { runBlogGeneration };
