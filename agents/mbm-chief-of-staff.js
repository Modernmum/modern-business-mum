/**
 * MODERN BUSINESS MUM - AI CHIEF OF STAFF
 * Your 24/7 strategic operations partner
 * Manages workspace, organizes data, maintains SOPs, answers questions
 * Never forgets, always available, constantly learning your business
 */

import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * AI Chief of Staff - Main Intelligence
 */
class MBMChiefOfStaff {
  constructor(clientId) {
    this.clientId = clientId;
    this.memory = [];
    this.sopDatabase = {};
  }

  /**
   * Process incoming question/request
   */
  async processRequest(request) {
    console.log(`\n🧠 AI Chief of Staff processing: "${request}"\n`);

    // Build context from memory and SOPs
    const context = await this.buildContext(request);

    const prompt = `You are an AI Chief of Staff for Modern Business Mum clients. You have perfect memory of all conversations, documents, and procedures.

CONTEXT:
${context}

CLIENT REQUEST:
${request}

Provide a helpful, actionable response. If you need more information, ask specific questions. If you can take action, describe exactly what you'll do.

Keep responses professional but warm. You're a trusted strategic partner.`;

    const response = await generateText(prompt, 'text');

    // Store this interaction in memory
    await this.storeInMemory(request, response);

    return response;
  }

  /**
   * Build contextual knowledge for responses
   */
  async buildContext(request) {
    // Get relevant past conversations
    const { data: recentMemory } = await supabase
      .from('mbm_ai_interactions')
      .select('*')
      .eq('client_id', this.clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get relevant SOPs
    const { data: sops } = await supabase
      .from('mbm_client_sops')
      .select('*')
      .eq('client_id', this.clientId);

    let context = '';

    if (recentMemory && recentMemory.length > 0) {
      context += 'RECENT CONVERSATIONS:\n';
      recentMemory.forEach(conv => {
        context += `- ${conv.request}: ${conv.response.substring(0, 100)}...\n`;
      });
    }

    if (sops && sops.length > 0) {
      context += '\nSTANDARD OPERATING PROCEDURES:\n';
      sops.forEach(sop => {
        context += `- ${sop.title}: ${sop.content}\n`;
      });
    }

    return context;
  }

  /**
   * Store interaction in long-term memory
   */
  async storeInMemory(request, response) {
    await supabase.from('mbm_ai_interactions').insert({
      client_id: this.clientId,
      agent_type: 'chief_of_staff',
      request: request,
      response: response,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Create or update SOP
   */
  async manageSOP(title, content, category) {
    const { data, error } = await supabase
      .from('mbm_client_sops')
      .upsert({
        client_id: this.clientId,
        title: title,
        content: content,
        category: category,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving SOP:', error);
      return { success: false, error };
    }

    console.log(`✅ SOP "${title}" saved successfully`);
    return { success: true, data };
  }

  /**
   * Daily briefing - what the client needs to know
   */
  async generateDailyBriefing() {
    const prompt = `You are the AI Chief of Staff for a Modern Business Mum client. Generate a daily briefing for your client.

Include:
1. Key priorities for today
2. Outstanding items requiring attention
3. Recent wins to celebrate
4. Upcoming deadlines (next 7 days)
5. Strategic recommendations

Keep it concise (3-5 bullet points per section).`;

    const briefing = await generateText(prompt, 'text');

    // Store briefing
    await this.storeInMemory('Daily Briefing Request', briefing);

    return briefing;
  }

  /**
   * Answer questions about the business
   */
  async answerQuestion(question) {
    return await this.processRequest(question);
  }

  /**
   * Organize workspace data
   */
  async organizeWorkspace() {
    console.log('🗂️  Organizing workspace...');

    // Get all unorganized items
    const { data: items } = await supabase
      .from('mbm_workspace_items')
      .select('*')
      .eq('client_id', this.clientId)
      .eq('organized', false);

    if (!items || items.length === 0) {
      return 'Workspace is already organized!';
    }

    const prompt = `You are organizing a workspace for a Modern Business Mum client. Categorize and structure these items:

${JSON.stringify(items, null, 2)}

Provide:
1. Suggested categories
2. Organizational structure
3. Tags for each item
4. Priority levels

Output as JSON with this structure:
{
  "categories": ["Category 1", "Category 2"],
  "items": [
    {
      "id": "item_id",
      "category": "Category name",
      "tags": ["tag1", "tag2"],
      "priority": "high|medium|low"
    }
  ]
}`;

    const organization = await generateText(prompt, 'json');

    // Apply organization
    for (const item of organization.items) {
      await supabase
        .from('mbm_workspace_items')
        .update({
          category: item.category,
          tags: item.tags,
          priority: item.priority,
          organized: true,
        })
        .eq('id', item.id);
    }

    return `✅ Organized ${items.length} items into ${organization.categories.length} categories`;
  }
}

/**
 * Test the AI Chief of Staff
 */
const testChiefOfStaff = async () => {
  console.log('\n🚀 Testing Modern Business Mum AI Chief of Staff\n');

  const chief = new MBMChiefOfStaff('test-client-001');

  // Test 1: Answer a question
  console.log('TEST 1: Answering question');
  const answer = await chief.answerQuestion('What are our top priorities this week?');
  console.log('Response:', answer);

  // Test 2: Generate daily briefing
  console.log('\nTEST 2: Daily briefing');
  const briefing = await chief.generateDailyBriefing();
  console.log('Briefing:', briefing);

  // Test 3: Create SOP
  console.log('\nTEST 3: Creating SOP');
  await chief.manageSOP(
    'Client Onboarding',
    '1. Welcome email\n2. Setup call\n3. Workspace configuration\n4. First check-in',
    'Operations'
  );

  console.log('\n✅ Modern Business Mum AI Chief of Staff tests complete\n');
};

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testChiefOfStaff()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { MBMChiefOfStaff };
