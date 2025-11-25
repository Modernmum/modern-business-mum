/**
 * Template File Generator
 * Creates downloadable Notion template files from AI-generated structures
 */

import fs from 'fs';
import path from 'path';

/**
 * Generate a complete Notion template as a markdown file
 */
export const generateNotionTemplate = (product) => {
  const template = product.template_content;

  let markdown = `# ${template.title}\n\n`;
  markdown += `> ${template.tagline}\n\n`;
  markdown += `---\n\n`;

  // Add setup instructions
  if (template.setupInstructions) {
    markdown += `## 📖 Quick Start Guide\n\n`;
    markdown += `${template.setupInstructions}\n\n`;
    markdown += `---\n\n`;
  }

  // Add overview with features
  markdown += `## ✨ Key Features\n\n`;
  template.features.forEach((feature, i) => {
    markdown += `${i + 1}. **${feature}**\n`;
  });
  markdown += `\n---\n\n`;

  // Add use cases
  if (template.useCases && template.useCases.length > 0) {
    markdown += `## 💡 Perfect For\n\n`;
    template.useCases.forEach((useCase, i) => {
      markdown += `- ${useCase}\n`;
    });
    markdown += `\n---\n\n`;
  }

  // Add target audience
  if (template.targetAudience && template.targetAudience.length > 0) {
    markdown += `## 👥 Who This Is For\n\n`;
    template.targetAudience.forEach((audience) => {
      markdown += `- ${audience}\n`;
    });
    markdown += `\n---\n\n`;
  }

  // Generate each section with detailed content
  template.sections.forEach((section, i) => {
    markdown += `## ${i + 1}. ${section.name}\n\n`;
    markdown += `${section.description}\n\n`;

    if (section.components && section.components.length > 0) {
      markdown += `### Components:\n\n`;
      section.components.forEach((component) => {
        markdown += `#### ${component}\n\n`;

        // Generate sample content based on component type
        if (component.toLowerCase().includes('database') || component.toLowerCase().includes('table')) {
          markdown += generateDatabaseExample(product.niche, component);
        } else if (component.toLowerCase().includes('form') || component.toLowerCase().includes('input')) {
          markdown += generateFormExample(component);
        } else if (component.toLowerCase().includes('dashboard') || component.toLowerCase().includes('view')) {
          markdown += generateDashboardExample(product.niche);
        } else {
          markdown += `*This section helps you ${section.description.toLowerCase()}*\n\n`;
        }
      });
    }

    markdown += `\n---\n\n`;
  });

  // Add footer
  markdown += `## 🎯 Getting Started\n\n`;
  markdown += `1. Import this template into your Notion workspace\n`;
  markdown += `2. Customize the sections to fit your needs\n`;
  markdown += `3. Start using it immediately!\n\n`;
  markdown += `---\n\n`;
  markdown += `*Created by Zero to Legacy Engine*\n`;
  markdown += `*For support, visit: modernbusinessmum.com*\n`;

  return markdown;
};

/**
 * Generate database/table example
 */
const generateDatabaseExample = (niche, componentName) => {
  const examples = {
    business: `| Name | Status | Priority | Due Date | Notes |
|------|--------|----------|----------|-------|
| Sample Task | In Progress | High | 2024-12-31 | Add your details here |
| Example Entry | Pending | Medium | 2024-12-15 | Customize as needed |

**How to use:** Add your own entries by clicking "New" in Notion.\n\n`,
    finance: `| Category | Amount | Date | Type | Notes |
|----------|--------|------|------|-------|
| Sample Entry | $100.00 | 2024-01-01 | Income | Example data |
| Example Transaction | $50.00 | 2024-01-02 | Expense | Customize this |

**How to use:** Log your financial data in this table.\n\n`
  };

  return examples[niche] || examples.business;
};

/**
 * Generate form example
 */
const generateFormExample = (componentName) => {
  return `**Field:** _____________________

**Description:** _____________________

**Date:** _____________________

**Notes:** _____________________

**How to use:** Fill in the fields above with your information.\n\n`;
};

/**
 * Generate dashboard example
 */
const generateDashboardExample = (niche) => {
  return `📊 **Key Metrics**
- Metric 1: [Your data]
- Metric 2: [Your data]
- Metric 3: [Your data]

📈 **Progress**
- Goal 1: [ ] 0%
- Goal 2: [ ] 0%
- Goal 3: [ ] 0%

**How to use:** Update these metrics regularly to track your progress.\n\n`;
};

/**
 * Save template to file system
 */
export const saveTemplateToFile = (product) => {
  const templatesDir = path.join(process.cwd(), 'templates');

  // Create templates directory if it doesn't exist
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  // Generate filename
  const filename = `${product.id}-${product.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  const filepath = path.join(templatesDir, filename);

  // Generate template content
  const content = generateNotionTemplate(product);

  // Save to file
  fs.writeFileSync(filepath, content, 'utf-8');

  return {
    filepath,
    filename,
    url: `file://${filepath}`
  };
};

/**
 * Generate a PDF version (simple text-based)
 */
export const generatePDFGuide = (product) => {
  // For now, we'll create a rich text file that can be converted to PDF
  const content = generateNotionTemplate(product);

  const guidesDir = path.join(process.cwd(), 'guides');
  if (!fs.existsSync(guidesDir)) {
    fs.mkdirSync(guidesDir, { recursive: true });
  }

  const filename = `${product.id}-guide.txt`;
  const filepath = path.join(guidesDir, filename);

  fs.writeFileSync(filepath, content, 'utf-8');

  return {
    filepath,
    filename,
    url: `file://${filepath}`
  };
};

export default {
  generateNotionTemplate,
  saveTemplateToFile,
  generatePDFGuide
};
