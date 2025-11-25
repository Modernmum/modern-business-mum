/**
 * AI Client - Claude API Integration
 * Handles all AI-powered content generation for templates
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { CONFIG } from '../config/settings.js';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Delay helper for rate limiting
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate a complete Notion template structure
 */
export const generateTemplateStructure = async (category, niche, description) => {
  try {
    await delay(CONFIG.rateLimits.claudeRequestDelay);

    const prompt = `You are an expert Notion template designer. Create a comprehensive and professional Notion template structure for:

CATEGORY: ${category}
NICHE: ${niche}
DESCRIPTION: ${description}

Generate a complete template structure with the following JSON format:
{
  "title": "Catchy template name",
  "tagline": "One-line value proposition",
  "sections": [
    {
      "name": "Section name",
      "description": "What this section does",
      "components": ["Component 1", "Component 2", ...]
    }
  ],
  "features": [
    "Feature 1 with benefit",
    "Feature 2 with benefit",
    ...
  ],
  "useCases": [
    "Use case 1",
    "Use case 2",
    ...
  ],
  "targetAudience": ["Audience type 1", "Audience type 2"],
  "setupInstructions": "Quick setup guide in 3-5 steps"
}

Make it professional, comprehensive, and focused on solving real problems. Include 5-10 key features, 3-5 sections, and 3-5 use cases.`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    // Clean up control characters that break JSON parsing
    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines properly
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    const templateStructure = JSON.parse(jsonText);
    return templateStructure;
  } catch (error) {
    console.error('Error generating template structure:', error.message);
    throw error;
  }
};

/**
 * Generate a compelling sales description for a template
 */
export const generateSalesDescription = async (title, features, niche, category) => {
  try {
    await delay(CONFIG.rateLimits.claudeRequestDelay);

    const prompt = `You are a expert copywriter specializing in digital products. Create a compelling sales description for this Notion template:

TITLE: ${title}
CATEGORY: ${category}
NICHE: ${niche}
KEY FEATURES:
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Create a sales description with the following structure:

1. HOOK: Start with a problem statement that resonates with the target audience
2. SOLUTION: Explain how this template solves their problem
3. BENEFITS: List 3-5 key benefits they'll get
4. FEATURES: Highlight the most important features
5. CALL TO ACTION: End with a compelling reason to buy now

Keep it concise (200-300 words), professional, and benefit-focused. Use emotional triggers and pain points relevant to ${niche} professionals.

Output only the sales description text, no JSON or formatting markers.`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error generating sales description:', error.message);
    throw error;
  }
};

/**
 * Generate manual listing instructions for platforms
 */
export const generateListingInstructions = async (product, platform = 'gumroad') => {
  try {
    await delay(CONFIG.rateLimits.claudeRequestDelay);

    const prompt = `Create step-by-step listing instructions for this product on ${platform}:

PRODUCT: ${product.title}
PRICE: $${product.suggested_price}
CATEGORY: ${product.niche}

Generate clear, actionable instructions for manually listing this product. Include:
1. How to create the listing
2. What title to use
3. What description to write
4. What price to set
5. What tags/categories to select
6. Any special settings to configure

Keep it practical and easy to follow. Output as plain text with numbered steps.`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error generating listing instructions:', error.message);
    throw error;
  }
};

/**
 * Analyze and score opportunity viability
 */
export const scoreOpportunity = async (category, niche, keywords) => {
  try {
    await delay(CONFIG.rateLimits.claudeRequestDelay);

    const prompt = `You are a market analyst. Evaluate the viability of this Notion template opportunity:

CATEGORY: ${category}
NICHE: ${niche}
KEYWORDS: ${keywords.join(', ')}

Rate the opportunity on a scale of 0-100 considering:
- Market demand
- Competition level
- Price point sustainability
- Target audience size
- Problem-solution fit

Output only a number between 0-100 representing the opportunity score.`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const scoreText = message.content[0].text.trim();
    const score = parseInt(scoreText.match(/\d+/)?.[0] || '70');
    return Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error('Error scoring opportunity:', error.message);
    // Return a default score on error
    return 70;
  }
};

/**
 * Generate opportunity description
 */
export const generateOpportunityDescription = async (category, niche, keywords) => {
  try {
    await delay(CONFIG.rateLimits.claudeRequestDelay);

    const prompt = `Create a concise opportunity description for a Notion template:

CATEGORY: ${category}
NICHE: ${niche}
KEYWORDS: ${keywords.join(', ')}

Write 1-2 sentences describing what this template will help users accomplish and why it's valuable.
Output only the description text.`;

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error generating opportunity description:', error.message);
    return `A comprehensive ${category} template designed for ${niche} professionals to streamline their workflow.`;
  }
};

/**
 * Test AI connection
 */
export const testConnection = async () => {
  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: 'Reply with "OK" if you can read this.',
        },
      ],
    });

    return {
      success: true,
      message: 'AI connection successful',
      response: message.content[0].text,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export default {
  generateTemplateStructure,
  generateSalesDescription,
  generateListingInstructions,
  scoreOpportunity,
  generateOpportunityDescription,
  testConnection,
};
