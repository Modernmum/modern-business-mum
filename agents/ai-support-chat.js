/**
 * AI-POWERED CUSTOMER SUPPORT CHATBOT
 * 24/7 automated support using Claude AI
 *
 * Handles:
 * - Product questions
 * - Purchase support
 * - Template customization requests
 * - Service bookings
 * - Upselling
 */

import { generateText } from '../lib/ai.js';
import { getProducts, logAction } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get relevant context for the chat
 */
const getContext = async () => {
  const products = await getProducts({ status: 'listed' });

  return {
    products: products.map(p => ({
      title: p.title,
      description: p.description.substring(0, 150),
      price: p.suggested_price,
      niche: p.niche,
      features: p.features.slice(0, 3),
    })),
    services: [
      {
        name: 'Custom Template Creation',
        price: '$100-500',
        description: 'We create a custom Notion template tailored to your exact needs',
        turnaround: '24-48 hours',
      },
      {
        name: 'Notion Setup Service',
        price: '$200-1000',
        description: 'Complete Notion workspace setup for your business',
        turnaround: '48 hours',
      },
      {
        name: 'Notion Consulting',
        price: '$100-200/hour',
        description: '1-on-1 consultation to optimize your Notion setup',
        turnaround: 'Book instantly',
      },
    ],
  };
};

/**
 * Generate AI support response
 */
export const generateSupportResponse = async (userMessage, conversationHistory = []) => {
  try {
    const context = await getContext();

    const systemPrompt = `You are a helpful customer support agent for Modern Business, a Notion templates and services company.

**Available Products:**
${context.products.map(p => `- ${p.title} ($${p.price}): ${p.description}`).join('\n')}

**Available Services:**
${context.services.map(s => `- ${s.name} (${s.price}): ${s.description} | Turnaround: ${s.turnaround}`).join('\n')}

**Your Role:**
1. Answer questions about products and services
2. Help customers choose the right template
3. Provide support with installation/usage
4. Upsell services naturally when relevant
5. Book service calls when customers are interested
6. Be friendly, helpful, and professional
7. If you don't know something, admit it and offer to connect them with a human

**Conversation History:**
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

**Customer Message:** ${userMessage}

Respond helpfully and conversationally. Keep responses under 150 words. If they want to buy, give them the link to https://modernbusinessmum.com.`;

    const response = await generateText(systemPrompt, 'text');

    // Log the interaction
    await logAction('ai-support', 'chat_response', 'success', {
      user_message: userMessage.substring(0, 100),
      response_length: response.length,
    });

    return {
      success: true,
      response,
      suggested_actions: extractSuggestedActions(response, context),
    };

  } catch (error) {
    console.error('Error generating support response:', error);
    return {
      success: false,
      response: "I'm having trouble connecting right now. Please email us at hello@modernbusinessmum.com and we'll get back to you within 24 hours!",
      error: error.message,
    };
  }
};

/**
 * Extract suggested actions from response
 */
const extractSuggestedActions = (response, context) => {
  const actions = [];

  // Check if response mentions products
  context.products.forEach(product => {
    if (response.toLowerCase().includes(product.title.toLowerCase())) {
      actions.push({
        type: 'view_product',
        label: `View ${product.title}`,
        url: `https://modernbusinessmum.com#${product.title.toLowerCase().replace(/\s+/g, '-')}`,
      });
    }
  });

  // Check if response mentions services
  if (response.toLowerCase().includes('custom') || response.toLowerCase().includes('service')) {
    actions.push({
      type: 'book_service',
      label: 'Book a Service Call',
      url: 'https://modernbusinessmum.com/services',
    });
  }

  // Check if response suggests contacting
  if (response.toLowerCase().includes('email') || response.toLowerCase().includes('contact')) {
    actions.push({
      type: 'contact',
      label: 'Email Us',
      url: 'mailto:hello@modernbusinessmum.com',
    });
  }

  return actions;
};

/**
 * Handle specific intents
 */
export const handleIntent = async (intent, data) => {
  switch (intent) {
    case 'request_custom_template':
      return {
        response: "I'd love to create a custom template for you! To get started, please tell me:\n\n1. What do you want to track/manage?\n2. What's your role/business type?\n3. Any specific features you need?\n\nOur custom templates range from $100-500 and are delivered in 24-48 hours.",
        next_step: 'collect_requirements',
      };

    case 'ask_about_pricing':
      const products = await getProducts({ status: 'listed' });
      return {
        response: `Our templates range from $${Math.min(...products.map(p => p.suggested_price))} to $${Math.max(...products.map(p => p.suggested_price))}. We also offer:\n\n- Custom Template Creation: $100-500\n- Notion Setup Service: $200-1000\n- Consulting: $100-200/hour\n\nWhat are you interested in?`,
      };

    case 'book_service':
      return {
        response: "Great! Let's get you set up. Which service are you interested in?\n\n1. Custom Template ($100-500)\n2. Full Notion Setup ($200-1000)\n3. Consulting Call ($100-200/hr)\n\nReply with the number or tell me more about what you need!",
        next_step: 'select_service',
      };

    default:
      return await generateSupportResponse(data.message, data.history);
  }
};

export default {
  generateSupportResponse,
  handleIntent,
};
