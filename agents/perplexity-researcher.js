/**
 * PERPLEXITY AI RESEARCHER
 * Real-time web research to supercharge content and product decisions
 *
 * Uses:
 * - Trend research for new product ideas
 * - Competitor analysis
 * - SEO keyword research
 * - Market validation
 * - Content generation with latest data
 */

import { logAction } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_BASE = 'https://api.perplexity.ai';

/**
 * Research with Perplexity AI
 */
export const researchWithPerplexity = async (query, options = {}) => {
  try {
    if (!PERPLEXITY_API_KEY) {
      console.log('⚠️  Perplexity API key not configured');
      return {
        success: false,
        error: 'API key not configured',
        message: 'Add PERPLEXITY_API_KEY to .env file',
      };
    }

    const response = await fetch(`${PERPLEXITY_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful research assistant. Provide accurate, up-to-date information with sources.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: options.temperature || 0.2,
        top_p: options.top_p || 0.9,
        return_citations: true,
        return_related_questions: true,
        search_recency_filter: options.recency || 'month', // day, week, month, year
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Perplexity API request failed');
    }

    const result = {
      success: true,
      answer: data.choices[0].message.content,
      citations: data.citations || [],
      related_questions: data.related_questions || [],
      model: data.model,
    };

    // Log the research
    await logAction('perplexity-research', 'query_completed', 'success', {
      query: query.substring(0, 100),
      citations_count: result.citations.length,
    });

    return result;

  } catch (error) {
    console.error('Perplexity research error:', error);
    await logAction('perplexity-research', 'query_failed', 'error', {
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Research trending Notion template ideas
 */
export const researchTrendingTemplates = async () => {
  const query = `What are the most popular and in-demand Notion template types right now in 2025?
Include specific examples of templates that are selling well on marketplaces like Notion Template Gallery, Gumroad, and Etsy.
Focus on business, productivity, and finance niches. Provide data on search volume and demand if available.`;

  return await researchWithPerplexity(query, {
    recency: 'week',
    systemPrompt: 'You are a market research expert specializing in digital products and Notion templates.',
  });
};

/**
 * Research competitors
 */
export const researchCompetitors = async (niche) => {
  const query = `Who are the top Notion template sellers in the ${niche} niche?
What templates do they offer, what are their price points, and what makes them successful?
Include specific stores, creators, and products that are performing well.`;

  return await researchWithPerplexity(query, {
    recency: 'month',
  });
};

/**
 * Research SEO keywords for a product
 */
export const researchSEOKeywords = async (productTitle, productDescription) => {
  const query = `What are the best SEO keywords to target for a Notion template product called "${productTitle}"?
The template is: ${productDescription}
Provide keyword ideas with search volume estimates, competition level, and related long-tail keywords.`;

  return await researchWithPerplexity(query, {
    recency: 'month',
  });
};

/**
 * Validate product idea with market research
 */
export const validateProductIdea = async (productIdea) => {
  const query = `Is there market demand for a Notion template that does: ${productIdea}?
Research current market demand, existing solutions, pricing expectations, target audience, and potential challenges.
Provide a recommendation on whether this is a viable product.`;

  return await researchWithPerplexity(query, {
    recency: 'month',
  });
};

/**
 * Research content ideas for blog/social
 */
export const researchContentIdeas = async (topic, platform) => {
  const query = `What are the trending content topics and formats for ${topic} on ${platform} right now?
What type of content gets the most engagement? Provide specific post ideas and angles.`;

  return await researchWithPerplexity(query, {
    recency: 'week',
  });
};

/**
 * Research pricing strategy
 */
export const researchPricingStrategy = async (productType, niche) => {
  const query = `What is the typical pricing for ${productType} Notion templates in the ${niche} niche?
What do top sellers charge? What pricing strategies work best? Should I use tiered pricing, bundles, or subscriptions?`;

  return await researchWithPerplexity(query, {
    recency: 'month',
  });
};

export default {
  researchWithPerplexity,
  researchTrendingTemplates,
  researchCompetitors,
  researchSEOKeywords,
  validateProductIdea,
  researchContentIdeas,
  researchPricingStrategy,
};
