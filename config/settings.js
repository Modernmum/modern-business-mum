/**
 * Zero to Legacy Engine Configuration
 * Central configuration for all agents and system settings
 */

export const CONFIG = {
  // Target niches and categories
  niches: {
    business: {
      name: 'Business/Entrepreneurs',
      categories: [
        { type: 'Client CRM', price: 29, keywords: ['client management', 'customer relationship', 'contact database'] },
        { type: 'Project Dashboard', price: 25, keywords: ['project tracking', 'task management', 'team collaboration'] },
        { type: 'SOP Library', price: 35, keywords: ['standard operating procedures', 'process documentation', 'workflow'] },
        { type: 'Meeting Notes', price: 19, keywords: ['meeting management', 'notes', 'action items'] },
        { type: 'OKR Tracker', price: 25, keywords: ['objectives', 'key results', 'goal tracking'] },
        { type: 'Business Dashboard', price: 45, keywords: ['business metrics', 'kpi tracking', 'analytics'] },
        { type: 'Content Calendar', price: 22, keywords: ['content planning', 'social media', 'editorial calendar'] }
      ]
    },
    finance: {
      name: 'Finance/Budgeting',
      categories: [
        { type: 'Budget Tracker', price: 19, keywords: ['budgeting', 'expense tracking', 'spending'] },
        { type: 'Net Worth Dashboard', price: 25, keywords: ['net worth', 'asset tracking', 'wealth management'] },
        { type: 'Debt Payoff Planner', price: 22, keywords: ['debt management', 'loan tracking', 'payoff strategy'] },
        { type: 'Investment Portfolio', price: 29, keywords: ['investment tracking', 'portfolio management', 'stocks'] },
        { type: 'Savings Goal Tracker', price: 15, keywords: ['savings goals', 'emergency fund', 'financial goals'] },
        { type: 'Financial Freedom Dashboard', price: 35, keywords: ['financial independence', 'fire', 'retirement planning'] }
      ]
    }
  },

  // Agent behavior settings
  agents: {
    scout: {
      opportunitiesPerCycle: 10, // How many opportunities to discover per run
      trendScoreThreshold: 40, // Minimum trend score to consider (0-100)
      priorityNiches: ['business', 'finance'], // Niches to focus on
    },
    creator: {
      maxCreationsPerCycle: 10, // How many products to create per run
      minFeaturesCount: 5, // Minimum features per template
      maxFeaturesCount: 12, // Maximum features per template
      includeUseCases: true, // Generate use cases for each template
    },
    executor: {
      maxListingsPerCycle: 10, // How many products to list per run
      defaultPlatform: 'stripe', // Primary selling platform
      generateInstructions: true, // Generate manual listing instructions
      autoPublish: true, // Auto-publish to Stripe
    }
  },

  // API rate limits and delays
  rateLimits: {
    claudeRequestDelay: 1000, // Delay between Claude API requests (ms)
    gumroadRequestDelay: 2000, // Delay between Gumroad API requests (ms)
    maxRetriesPerRequest: 3, // Max retries for failed API calls
  },

  // Revenue and pricing settings
  pricing: {
    minPrice: 15,
    maxPrice: 45,
    currency: 'USD',
    discountPercentage: 0, // Launch discount (0 = no discount)
  },

  // System thresholds
  thresholds: {
    maxOpportunitiesInQueue: 10, // Max opportunities before pausing scout
    maxProductsInQueue: 5, // Max products before pausing creator
    minTrendScore: 60, // Minimum trend score to proceed
  },

  // Logging configuration
  logging: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logToDatabase: true,
    logToConsole: true,
  },

  // Template structure defaults
  templateDefaults: {
    sections: [
      'Overview',
      'Quick Start Guide',
      'Main Dashboard',
      'Data Entry',
      'Reports & Analytics',
      'Settings & Customization'
    ],
    includeInstructions: true,
    includeExamples: true,
    colorScheme: 'professional', // 'professional', 'vibrant', 'minimal'
  }
};

// Helper functions for config access
export const getNicheCategories = (niche) => {
  return CONFIG.niches[niche]?.categories || [];
};

export const getAllCategories = () => {
  const categories = [];
  Object.keys(CONFIG.niches).forEach(niche => {
    CONFIG.niches[niche].categories.forEach(cat => {
      categories.push({ ...cat, niche });
    });
  });
  return categories;
};

export const getCategoryByType = (type) => {
  for (const niche of Object.keys(CONFIG.niches)) {
    const category = CONFIG.niches[niche].categories.find(cat => cat.type === type);
    if (category) {
      return { ...category, niche };
    }
  }
  return null;
};

export default CONFIG;
