/**
 * SEO CONTENT GENERATOR AGENT
 * Creates SEO-optimized blog posts for each product
 * Drives organic traffic from Google
 *
 * Strategy:
 * - Keyword research for each product
 * - Long-form blog posts (1500+ words)
 * - Internal linking to products
 * - Comparison articles
 * - How-to guides
 */

import { getProducts, logAction } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate SEO-optimized blog post for a product
 */
const generateProductBlogPost = async (product) => {
  const prompt = `You are an SEO content expert and Notion productivity specialist.

Product: ${product.title}
Description: ${product.description}
Features: ${product.features.join(', ')}
Niche: ${product.niche}
Price: $${product.suggested_price}

Create a comprehensive, SEO-optimized blog post that:
1. Targets the keyword: "notion ${product.title.toLowerCase()}"
2. Provides genuine value (not just a sales pitch)
3. Includes step-by-step guidance
4. Has natural product placement
5. Is 1500+ words
6. Uses H2, H3 headings for structure
7. Includes a FAQ section
8. Has a compelling CTA

Return JSON:
{
  "title": "SEO-optimized title with keyword (60 chars max)",
  "meta_description": "Compelling meta description (155 chars max)",
  "slug": "url-friendly-slug",
  "keywords": ["primary keyword", "secondary keyword", "tertiary keyword"],
  "introduction": "Hook paragraph that draws readers in",
  "sections": [
    {
      "heading": "Section title",
      "content": "Detailed content"
    }
  ],
  "faq": [
    {
      "question": "Common question",
      "answer": "Helpful answer"
    }
  ],
  "conclusion": "Conclusion with CTA"
}`;

  const blogContent = await generateText(prompt, 'json');
  return blogContent;
};

/**
 * Generate comparison article
 */
const generateComparisonPost = async (products, niche) => {
  const prompt = `You are an SEO content expert creating a comparison guide.

Create a comprehensive comparison article for the top Notion ${niche} templates.

Products to compare:
${products.slice(0, 5).map(p => `- ${p.title}: ${p.description.substring(0, 100)}...`).join('\n')}

The article should:
1. Target keyword: "best notion ${niche} templates"
2. Be unbiased and helpful
3. Include pros/cons for each
4. Have a comparison table
5. Recommend based on use cases
6. Be 2000+ words
7. Link to products naturally

Return JSON:
{
  "title": "SEO title",
  "meta_description": "Meta description",
  "slug": "url-slug",
  "keywords": ["keywords"],
  "introduction": "Hook intro",
  "comparison_table": {
    "headers": ["Template", "Best For", "Key Features", "Price"],
    "rows": [
      ["Template name", "Use case", "Features", "$X"]
    ]
  },
  "detailed_reviews": [
    {
      "product_title": "Template name",
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1", "con 2"],
      "best_for": "Who should buy this",
      "content": "Detailed review"
    }
  ],
  "buying_guide": "How to choose section",
  "conclusion": "Final thoughts with CTA"
}`;

  const blogContent = await generateText(prompt, 'json');
  return blogContent;
};

/**
 * Generate how-to guide
 */
const generateHowToGuide = async (product) => {
  const prompt = `You are a productivity expert creating a tutorial guide.

Product: ${product.title}
Niche: ${product.niche}

Create a comprehensive how-to guide that:
1. Targets keyword: "how to ${product.title.toLowerCase()} in notion"
2. Provides step-by-step instructions
3. Includes screenshots placeholders
4. Mentions our template as a shortcut
5. Is genuinely helpful even without buying
6. 1200+ words

Return JSON:
{
  "title": "How to [achieve outcome] in Notion",
  "meta_description": "Meta description",
  "slug": "url-slug",
  "keywords": ["keywords"],
  "introduction": "Why this matters",
  "steps": [
    {
      "step_number": 1,
      "title": "Step title",
      "content": "Detailed instructions",
      "tip": "Pro tip"
    }
  ],
  "common_mistakes": ["Mistake 1", "Mistake 2"],
  "conclusion": "Wrap up mentioning our template"
}`;

  const blogContent = await generateText(prompt, 'json');
  return blogContent;
};

/**
 * Convert blog JSON to HTML
 */
const convertToHTML = (blog, product = null) => {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog.title}</title>
  <meta name="description" content="${blog.meta_description}">
  <meta name="keywords" content="${blog.keywords.join(', ')}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.8;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 36px; margin-bottom: 10px; color: #1f2937; }
    h2 { font-size: 28px; margin-top: 40px; margin-bottom: 15px; color: #1f2937; }
    h3 { font-size: 22px; margin-top: 30px; margin-bottom: 10px; color: #374151; }
    p { margin-bottom: 20px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .cta-box {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background: white;
      color: #1f2937;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin-top: 15px;
    }
    .faq { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .faq h4 { margin-top: 0; color: #1f2937; }
    ul { margin-left: 20px; }
    li { margin-bottom: 10px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <article>
    <h1>${blog.title}</h1>
    <div class="meta">Published by Modern Business | Last updated: ${new Date().toLocaleDateString()}</div>

    <p><strong>${blog.introduction}</strong></p>
`;

  // Add sections
  if (blog.sections) {
    blog.sections.forEach(section => {
      html += `
    <h2>${section.heading}</h2>
    <p>${section.content}</p>
`;
    });
  }

  // Add steps for how-to guides
  if (blog.steps) {
    blog.steps.forEach(step => {
      html += `
    <h3>Step ${step.step_number}: ${step.title}</h3>
    <p>${step.content}</p>
    ${step.tip ? `<p><em>💡 Pro Tip: ${step.tip}</em></p>` : ''}
`;
    });
  }

  // Add comparison table
  if (blog.comparison_table) {
    html += `<h2>Comparison Table</h2><table>`;
    html += `<tr>${blog.comparison_table.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    blog.comparison_table.rows.forEach(row => {
      html += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    });
    html += `</table>`;
  }

  // Add CTA box
  if (product) {
    html += `
    <div class="cta-box">
      <h2 style="color: white; margin-top: 0;">Ready to Get Started?</h2>
      <p>Save hours of setup time with our ready-to-use ${product.title} template.</p>
      <a href="${product.listing_url || 'https://modernbusinessmum.com'}" class="cta-button">Get the Template - $${product.suggested_price}</a>
    </div>
`;
  }

  // Add FAQ
  if (blog.faq && blog.faq.length > 0) {
    html += `<h2>Frequently Asked Questions</h2>`;
    blog.faq.forEach(item => {
      html += `
    <div class="faq">
      <h4>${item.question}</h4>
      <p>${item.answer}</p>
    </div>
`;
    });
  }

  // Add conclusion
  html += `
    <h2>Conclusion</h2>
    <p>${blog.conclusion}</p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="text-align: center;">
      <a href="/">← Back to Modern Business</a> |
      <a href="/blog">More Articles</a>
    </p>
  </article>
</body>
</html>`;

  return html;
};

/**
 * Main SEO Content Generator Agent
 */
export const runSEOContentGenerator = async () => {
  console.log('\n📝 SEO CONTENT GENERATOR AGENT STARTING...\n');

  try {
    await logAction('seo-content', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get all listed products
    const products = await getProducts({ status: 'listed' });

    if (products.length === 0) {
      console.log('ℹ️  No products to create content for.');
      return { articles_created: 0 };
    }

    console.log(`📊 Found ${products.length} products. Generating SEO content...\n`);

    const blogDir = path.join(process.cwd(), 'public', 'blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    const articlesCreated = [];

    // Generate product review posts for top 5 products
    const topProducts = products.slice(0, 5);
    for (const product of topProducts) {
      console.log(`  📝 Generating article for: ${product.title}`);

      const blogContent = await generateProductBlogPost(product);
      const html = convertToHTML(blogContent, product);

      const filename = `${blogContent.slug}.html`;
      const filepath = path.join(blogDir, filename);

      fs.writeFileSync(filepath, html);

      articlesCreated.push({
        product_id: product.id,
        title: blogContent.title,
        slug: blogContent.slug,
        filepath,
        type: 'product_review',
      });

      console.log(`  ✅ Created: ${filename}`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate comparison articles for each niche
    const niches = ['business', 'finance'];
    for (const niche of niches) {
      const nicheProducts = products.filter(p => p.niche === niche);

      if (nicheProducts.length >= 3) {
        console.log(`  📝 Generating comparison article for ${niche} templates`);

        const comparisonContent = await generateComparisonPost(nicheProducts, niche);
        const html = convertToHTML(comparisonContent);

        const filename = `${comparisonContent.slug}.html`;
        const filepath = path.join(blogDir, filename);

        fs.writeFileSync(filepath, html);

        articlesCreated.push({
          title: comparisonContent.title,
          slug: comparisonContent.slug,
          filepath,
          type: 'comparison',
          niche,
        });

        console.log(`  ✅ Created: ${filename}`);

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate how-to guides for top 3 products
    const howToProducts = products.slice(0, 3);
    for (const product of howToProducts) {
      console.log(`  📝 Generating how-to guide for: ${product.title}`);

      const howToContent = await generateHowToGuide(product);
      const html = convertToHTML(howToContent, product);

      const filename = `${howToContent.slug}.html`;
      const filepath = path.join(blogDir, filename);

      fs.writeFileSync(filepath, html);

      articlesCreated.push({
        product_id: product.id,
        title: howToContent.title,
        slug: howToContent.slug,
        filepath,
        type: 'how_to',
      });

      console.log(`  ✅ Created: ${filename}`);

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create blog index page
    const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - Modern Business Notion Templates</title>
  <meta name="description" content="Learn how to master Notion and boost productivity with our comprehensive guides and tutorials.">
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 42px; text-align: center; }
    .articles { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; margin-top: 50px; }
    .article-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; }
    .article-card h2 { font-size: 22px; margin-top: 0; }
    .article-card a { color: #1f2937; text-decoration: none; }
    .article-card a:hover { text-decoration: underline; }
    .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 12px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>📚 Modern Business Blog</h1>
  <p style="text-align: center; font-size: 18px; color: #666;">Master Notion and boost your productivity</p>

  <div class="articles">
    ${articlesCreated.map(article => `
    <div class="article-card">
      <span class="badge">${article.type.replace('_', ' ')}</span>
      <h2><a href="/blog/${article.slug}.html">${article.title}</a></h2>
    </div>
    `).join('')}
  </div>

  <p style="text-align: center; margin-top: 60px;">
    <a href="/">← Back to Store</a>
  </p>
</body>
</html>`;

    fs.writeFileSync(path.join(blogDir, 'index.html'), indexHTML);

    console.log(`\n✅ SEO Content Generator completed`);
    console.log(`📊 Articles created: ${articlesCreated.length}\n`);

    await logAction('seo-content', 'run_completed', 'success', {
      articles_created: articlesCreated.length,
      timestamp: new Date().toISOString(),
    });

    return {
      articles_created: articlesCreated.length,
      articles: articlesCreated,
    };

  } catch (error) {
    console.error('❌ SEO Content Generator failed:', error.message);
    await logAction('seo-content', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runSEOContentGenerator()
    .then((result) => {
      console.log('\n📊 SEO CONTENT SUMMARY:');
      console.log(`   Articles created: ${result.articles_created}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('SEO Content Generator Error:', error);
      process.exit(1);
    });
}

export default { runSEOContentGenerator };
