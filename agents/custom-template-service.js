/**
 * AUTOMATED CUSTOM TEMPLATE SERVICE
 * AI builds custom Notion templates from customer requirements
 *
 * THE MONEY MAKER:
 * - Customer pays $100-500
 * - AI does 90% of the work in 10 minutes
 * - You polish in 20 minutes
 * - Total: 30 min = $100-500 profit
 * - SCALE: Handle 10+ orders/day = $1000-5000/day potential
 */

import { generateText } from '../lib/ai.js';
import { researchWithPerplexity } from './perplexity-researcher.js';
import { logAction } from '../lib/database.js';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Parse customer requirements from order
 */
const parseRequirements = async (customerInput) => {
  const prompt = `You are a requirements analyst for a Notion template creation service.

Customer Request:
"${customerInput}"

Extract and structure the requirements:
1. What they want to track/manage
2. Key features needed
3. User type/role
4. Industry/niche
5. Specific workflows mentioned
6. Integration needs
7. Complexity level (simple/medium/complex)

Return JSON:
{
  "primary_goal": "What they want to accomplish",
  "features": ["Feature 1", "Feature 2", ...],
  "user_type": "entrepreneur/manager/etc",
  "industry": "finance/business/etc",
  "workflows": ["Workflow 1", "Workflow 2"],
  "complexity": "simple|medium|complex",
  "estimated_price": 100-500,
  "estimated_hours": 1-4,
  "special_requirements": ["Any unique needs"]
}`;

  const requirements = await generateText(prompt, 'json');
  return requirements;
};

/**
 * Research best practices for this type of template
 */
const researchBestPractices = async (requirements) => {
  const query = `What are the best practices for creating a Notion template for ${requirements.primary_goal}?
What databases, properties, views, and features should be included?
What makes a great ${requirements.industry} template in Notion?`;

  const research = await researchWithPerplexity(query);
  return research.answer;
};

/**
 * Generate the custom template structure
 */
const generateTemplateStructure = async (requirements, bestPractices) => {
  const prompt = `You are an expert Notion template architect.

Customer Requirements:
${JSON.stringify(requirements, null, 2)}

Best Practices Research:
${bestPractices}

Create a comprehensive Notion template structure that:
1. Meets all customer requirements
2. Follows Notion best practices
3. Is well-organized and intuitive
4. Includes powerful features (relations, rollups, formulas)
5. Has beautiful formatting and emojis
6. Is ready to use immediately

Return JSON with complete template structure:
{
  "template_name": "Professional name",
  "description": "What this template does",
  "databases": [
    {
      "name": "Database name",
      "icon": "emoji",
      "properties": [
        {
          "name": "Property name",
          "type": "text|number|select|multi-select|date|checkbox|url|email|phone|formula|relation|rollup",
          "config": {} // Property-specific config
        }
      ],
      "views": [
        {
          "name": "View name",
          "type": "table|board|calendar|timeline|gallery|list",
          "filters": [],
          "sorts": [],
          "grouping": null
        }
      ],
      "sample_data": [] // Example entries
    }
  ],
  "pages": [
    {
      "title": "Page title",
      "icon": "emoji",
      "content": "Page content in markdown",
      "subpages": []
    }
  ],
  "setup_instructions": ["Step 1", "Step 2", ...],
  "usage_guide": "How to use this template effectively",
  "pro_tips": ["Tip 1", "Tip 2", ...],
  "customization_options": ["What they can customize"],
  "video_script": "2-minute walkthrough script for explaining the template"
}`;

  const structure = await generateText(prompt, 'json');
  return structure;
};

/**
 * Generate Notion-compatible markdown
 */
const generateNotionMarkdown = (structure) => {
  let markdown = `# ${structure.template_name}\n\n`;
  markdown += `${structure.description}\n\n`;
  markdown += `---\n\n`;

  // Add setup instructions
  markdown += `## 🚀 Setup Instructions\n\n`;
  structure.setup_instructions.forEach((step, i) => {
    markdown += `${i + 1}. ${step}\n`;
  });
  markdown += `\n`;

  // Add databases
  structure.databases.forEach(db => {
    markdown += `## ${db.icon} ${db.name}\n\n`;

    // Database properties
    markdown += `### Properties:\n`;
    db.properties.forEach(prop => {
      markdown += `- **${prop.name}** (${prop.type})\n`;
    });
    markdown += `\n`;

    // Views
    markdown += `### Views:\n`;
    db.views.forEach(view => {
      markdown += `- **${view.name}** (${view.type})\n`;
    });
    markdown += `\n`;
  });

  // Add pages
  structure.pages.forEach(page => {
    markdown += `## ${page.icon} ${page.title}\n\n`;
    markdown += `${page.content}\n\n`;
  });

  // Add usage guide
  markdown += `## 📖 Usage Guide\n\n`;
  markdown += `${structure.usage_guide}\n\n`;

  // Add pro tips
  markdown += `## 💡 Pro Tips\n\n`;
  structure.pro_tips.forEach(tip => {
    markdown += `- ${tip}\n`;
  });
  markdown += `\n`;

  // Add customization options
  markdown += `## 🎨 Customization Options\n\n`;
  structure.customization_options.forEach(option => {
    markdown += `- ${option}\n`;
  });

  return markdown;
};

/**
 * Create setup guide
 */
const generateSetupGuide = (structure) => {
  let guide = `${structure.template_name} - Setup Guide\n`;
  guide += `${'='.repeat(50)}\n\n`;

  guide += `WHAT THIS TEMPLATE DOES:\n`;
  guide += `${structure.description}\n\n`;

  guide += `QUICK START (5 MINUTES):\n`;
  structure.setup_instructions.forEach((step, i) => {
    guide += `${i + 1}. ${step}\n`;
  });
  guide += `\n`;

  guide += `USAGE GUIDE:\n`;
  guide += `${structure.usage_guide}\n\n`;

  guide += `PRO TIPS:\n`;
  structure.pro_tips.forEach((tip, i) => {
    guide += `${i + 1}. ${tip}\n`;
  });
  guide += `\n`;

  guide += `NEED HELP?\n`;
  guide += `Email: hello@modernbusinessmum.com\n`;
  guide += `Website: https://modernbusinessmum.com\n\n`;

  guide += `Thank you for your order!\n`;
  guide += `- Modern Business Team\n`;

  return guide;
};

/**
 * Process custom template order
 */
export const processCustomTemplateOrder = async (orderData) => {
  console.log(`\n🎨 PROCESSING CUSTOM TEMPLATE ORDER\n`);
  console.log(`Customer: ${orderData.customer_email}`);
  console.log(`Request: ${orderData.requirements.substring(0, 100)}...\n`);

  try {
    await logAction('custom-template-service', 'order_started', 'in_progress', {
      customer: orderData.customer_email,
      order_id: orderData.order_id,
    });

    // Step 1: Parse requirements
    console.log('📋 Step 1: Analyzing requirements...');
    const requirements = await parseRequirements(orderData.requirements);
    console.log(`✅ Complexity: ${requirements.complexity}`);
    console.log(`💰 Estimated price: $${requirements.estimated_price}`);

    // Step 2: Research best practices
    console.log('\n🔍 Step 2: Researching best practices...');
    const bestPractices = await researchBestPractices(requirements);
    console.log('✅ Research complete');

    // Step 3: Generate template structure
    console.log('\n🏗️  Step 3: Generating template structure...');
    const structure = await generateTemplateStructure(requirements, bestPractices);
    console.log(`✅ Generated: ${structure.databases.length} databases, ${structure.pages.length} pages`);

    // Step 4: Convert to Notion markdown
    console.log('\n📝 Step 4: Creating Notion files...');
    const markdown = generateNotionMarkdown(structure);
    const setupGuide = generateSetupGuide(structure);

    // Step 5: Save files
    const customDir = path.join(process.cwd(), 'custom-templates');
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }

    const orderFolder = path.join(customDir, `order-${orderData.order_id}`);
    if (!fs.existsSync(orderFolder)) {
      fs.mkdirSync(orderFolder, { recursive: true });
    }

    const templatePath = path.join(orderFolder, `${structure.template_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`);
    const guidePath = path.join(orderFolder, 'setup-guide.txt');
    const structurePath = path.join(orderFolder, 'structure.json');

    fs.writeFileSync(templatePath, markdown);
    fs.writeFileSync(guidePath, setupGuide);
    fs.writeFileSync(structurePath, JSON.stringify(structure, null, 2));

    console.log('✅ Files saved');

    // Step 6: Send to customer
    console.log('\n📧 Step 5: Delivering to customer...');

    const emailResult = await resend.emails.send({
      from: 'Modern Business <templates@modernbusinessmum.com>',
      to: orderData.customer_email,
      subject: `Your Custom Notion Template: ${structure.template_name} is Ready!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #1f2937; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .tip-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Custom Template is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi there!</p>

      <p>Great news! Your custom Notion template <strong>"${structure.template_name}"</strong> has been created and is attached to this email.</p>

      <h2>📦 What's Included:</h2>
      <ul>
        <li><strong>Template.md</strong> - Import this into Notion</li>
        <li><strong>Setup Guide.txt</strong> - Step-by-step instructions</li>
      </ul>

      <h2>🚀 Quick Start:</h2>
      <ol>
        ${structure.setup_instructions.slice(0, 3).map(step => `<li>${step}</li>`).join('')}
      </ol>

      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> ${structure.pro_tips[0]}
      </div>

      <h2>✨ Key Features:</h2>
      <ul>
        ${structure.databases.map(db => `<li>${db.icon} ${db.name}</li>`).join('')}
      </ul>

      <p><strong>Need modifications?</strong> Reply to this email within 7 days for unlimited revisions!</p>

      <p style="margin-top: 30px;">
        <strong>Questions or need help?</strong><br>
        Email us at hello@modernbusinessmum.com - we respond within 24 hours!
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="text-align: center; color: #666; font-size: 14px;">
        Thank you for choosing Modern Business!<br>
        <a href="https://modernbusinessmum.com">modernbusinessmum.com</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: `${structure.template_name}.md`,
          content: Buffer.from(markdown).toString('base64'),
        },
        {
          filename: 'Setup-Guide.txt',
          content: Buffer.from(setupGuide).toString('base64'),
        },
      ],
    });

    console.log('✅ Email sent!');

    // Step 7: Log completion
    await logAction('custom-template-service', 'order_completed', 'success', {
      customer: orderData.customer_email,
      order_id: orderData.order_id,
      template_name: structure.template_name,
      complexity: requirements.complexity,
      email_id: emailResult.data?.id,
    });

    console.log(`\n🎉 CUSTOM TEMPLATE ORDER COMPLETE!\n`);
    console.log(`Template: ${structure.template_name}`);
    console.log(`Files saved to: ${orderFolder}`);
    console.log(`Delivered to: ${orderData.customer_email}\n`);

    return {
      success: true,
      template_name: structure.template_name,
      order_id: orderData.order_id,
      files_path: orderFolder,
      structure,
    };

  } catch (error) {
    console.error('❌ Custom template order failed:', error);

    await logAction('custom-template-service', 'order_failed', 'error', {
      customer: orderData.customer_email,
      order_id: orderData.order_id,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Calculate pricing for custom template
 */
export const calculateCustomPrice = (requirements) => {
  const basePrice = 100;
  const complexityMultiplier = {
    simple: 1,
    medium: 1.5,
    complex: 2.5,
  };

  const featurePrice = requirements.features.length * 20;
  const complexityPrice = basePrice * complexityMultiplier[requirements.complexity];

  return Math.min(Math.round(complexityPrice + featurePrice), 500);
};

export default {
  processCustomTemplateOrder,
  calculateCustomPrice,
};
