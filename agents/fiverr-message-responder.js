/**
 * FIVERR INTELLIGENT MESSAGE RESPONDER
 * Automatically reads inbox messages and generates contextual AI responses
 */

import puppeteer from 'puppeteer';
import { generateText } from '../lib/ai.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Login to Fiverr
 */
const loginToFiverr = async (page) => {
  console.log('🔐 Logging into Fiverr...');

  await page.goto('https://www.fiverr.com/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await delay(3000);

  // Enter email
  const emailSelectors = [
    'input[name="username"]',
    'input[type="email"]',
    'input[placeholder*="Email"]',
    'input[placeholder*="email"]'
  ];

  for (const selector of emailSelectors) {
    try {
      const field = await page.$(selector);
      if (field) {
        await field.type(process.env.FIVERR_EMAIL, { delay: 100 });
        break;
      }
    } catch (e) {}
  }

  await delay(1000);

  // Enter password
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]'
  ];

  for (const selector of passwordSelectors) {
    try {
      const field = await page.$(selector);
      if (field) {
        await field.type(process.env.FIVERR_PASSWORD, { delay: 100 });
        break;
      }
    } catch (e) {}
  }

  await delay(1000);

  // Click login
  const loginButton = await page.$('button[type="submit"]');
  if (loginButton) {
    await loginButton.click();
    await delay(5000);
  }

  console.log('✅ Logged into Fiverr');
};

/**
 * Get unread messages from inbox
 */
const getUnreadMessages = async (page) => {
  console.log('📬 Checking for unread messages...');

  await page.goto('https://www.fiverr.com/inbox', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await delay(5000);

  // Extract all conversations
  const messages = await page.evaluate(() => {
    const results = [];

    // Look for message containers
    const messageElements = document.querySelectorAll('[data-thread-id], .thread-item, .inbox-thread');

    messageElements.forEach((el, index) => {
      // Check if unread
      const isUnread = el.querySelector('.unread, .new-message, .badge') ||
                       el.classList.contains('unread') ||
                       el.getAttribute('data-unread') === 'true';

      if (isUnread || index === 0) { // Also get first message for testing
        const buyerNameEl = el.querySelector('.username, .buyer-name, .sender-name, [data-username]');
        const previewEl = el.querySelector('.message-preview, .preview-text, .last-message');
        const threadId = el.getAttribute('data-thread-id') ||
                        el.getAttribute('data-conversation-id') ||
                        index.toString();

        results.push({
          threadId,
          buyerName: buyerNameEl?.textContent?.trim() || 'Unknown',
          preview: previewEl?.textContent?.trim() || '',
          isUnread: isUnread,
          element: el.outerHTML.substring(0, 200) // For debugging
        });
      }
    });

    return results;
  });

  console.log(`📊 Found ${messages.length} messages to process`);
  return messages;
};

/**
 * Read full conversation thread
 */
const readConversation = async (page, threadId) => {
  console.log(`📖 Reading conversation thread ${threadId}...`);

  // Click on the conversation
  try {
    await page.click(`[data-thread-id="${threadId}"]`);
  } catch (e) {
    // Try alternative selectors
    const threads = await page.$$('.thread-item, .inbox-thread');
    if (threads[0]) {
      await threads[0].click();
    }
  }

  await delay(3000);

  // Extract all messages in the conversation
  const conversation = await page.evaluate(() => {
    const messages = [];
    const messageElements = document.querySelectorAll('.message, .chat-message, [data-message-id]');

    messageElements.forEach(el => {
      const sender = el.querySelector('.sender, .username')?.textContent?.trim() ||
                    (el.classList.contains('from-buyer') ? 'buyer' : 'seller');
      const text = el.querySelector('.message-text, .text, .content')?.textContent?.trim() ||
                  el.textContent?.trim() || '';
      const timestamp = el.querySelector('.timestamp, .time')?.textContent?.trim() || '';

      if (text.length > 0) {
        messages.push({
          sender,
          text,
          timestamp
        });
      }
    });

    // Also try to get gig context
    const gigInfo = document.querySelector('.gig-title, .order-title')?.textContent?.trim() || '';

    return {
      messages,
      gigContext: gigInfo
    };
  });

  return conversation;
};

/**
 * Generate intelligent response using AI
 */
const generateResponse = async (conversation, buyerName, gigContext) => {
  console.log('🤖 Generating AI response...');

  // Format conversation history
  const conversationHistory = conversation.messages
    .map(m => `${m.sender}: ${m.text}`)
    .join('\n\n');

  const prompt = `You are a professional Fiverr seller responding to a buyer inquiry about Notion templates.

BUYER: ${buyerName}
GIG: ${gigContext || 'Business and Finance Services Templates'}

CONVERSATION HISTORY:
${conversationHistory}

Your business details:
- You create custom Notion templates for business, finance, productivity
- Templates include: Business Dashboards, Financial Trackers, Client Management, Project Management
- Each template comes with: Custom databases, automated formulas, setup instructions, video walkthrough, 30 days support
- You're professional, friendly, and focused on understanding their needs
- Your brand: Modern Business Mum

Generate a professional, personalized response that:
1. Addresses their specific question or concern
2. Provides helpful details about what you offer
3. Asks relevant follow-up questions to understand their needs
4. Encourages them to place an order or continue the conversation
5. Is warm but professional, concise but informative

Keep the response under 150 words. Use a friendly, approachable tone.

Return ONLY the message text, no extra formatting.`;

  const response = await generateText(prompt);
  return response.trim();
};

/**
 * Send response via Fiverr
 */
const sendResponse = async (page, responseText) => {
  console.log('📤 Sending response...');

  // Find message input field
  const inputSelectors = [
    'textarea[name="message"]',
    'textarea[placeholder*="message"]',
    '.message-input textarea',
    '#message-input',
    '[contenteditable="true"]'
  ];

  let messageField = null;
  for (const selector of inputSelectors) {
    try {
      messageField = await page.$(selector);
      if (messageField) break;
    } catch (e) {}
  }

  if (!messageField) {
    console.log('⚠️  Could not find message input field');
    return false;
  }

  // Type the message
  await messageField.click();
  await delay(500);
  await messageField.type(responseText, { delay: 30 });
  await delay(1000);

  // Find and click send button
  const sendButtonSelectors = [
    'button[type="submit"]',
    'button:has-text("Send")',
    '.send-button',
    'button.send',
    '[aria-label*="Send"]'
  ];

  for (const selector of sendButtonSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        console.log('✅ Response sent!');
        return true;
      }
    } catch (e) {}
  }

  // If no button found, try pressing Enter
  await messageField.press('Enter');
  console.log('✅ Response sent (via Enter)!');
  return true;
};

/**
 * Log interaction to database
 */
const logInteraction = async (buyerName, inquiry, response) => {
  await supabase.from('fiverr_messages').insert({
    buyer_name: buyerName,
    inquiry_text: inquiry,
    response_text: response,
    responded_at: new Date().toISOString(),
    status: 'sent'
  });
};

/**
 * Main automation
 */
const runMessageResponder = async (autoReply = false) => {
  console.log('\n🤖 FIVERR MESSAGE RESPONDER STARTING...\n');

  if (!process.env.FIVERR_EMAIL || !process.env.FIVERR_PASSWORD) {
    console.log('⚠️  Fiverr credentials not configured');
    return;
  }

  const browser = await puppeteer.launch({
    headless: false, // Visible for manual intervention if needed
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    // Login
    await loginToFiverr(page);

    // Get unread messages
    const unreadMessages = await getUnreadMessages(page);

    if (unreadMessages.length === 0) {
      console.log('📭 No unread messages');
      await browser.close();
      return;
    }

    // Process each message
    for (const msg of unreadMessages) {
      console.log(`\n📨 Processing message from: ${msg.buyerName}`);
      console.log(`   Preview: "${msg.preview.substring(0, 60)}..."`);

      // Read full conversation
      const conversation = await readConversation(page, msg.threadId);

      if (conversation.messages.length === 0) {
        console.log('⚠️  Could not read conversation, skipping...');
        continue;
      }

      console.log(`   Messages in thread: ${conversation.messages.length}`);

      // Get last buyer message
      const lastBuyerMessage = conversation.messages
        .filter(m => m.sender.toLowerCase().includes('buyer') || m.sender === msg.buyerName)
        .pop();

      if (!lastBuyerMessage) {
        console.log('⚠️  No buyer message found, skipping...');
        continue;
      }

      console.log(`   Last buyer message: "${lastBuyerMessage.text.substring(0, 80)}..."`);

      // Generate response
      const aiResponse = await generateResponse(
        conversation,
        msg.buyerName,
        conversation.gigContext
      );

      console.log('\n💬 Generated Response:');
      console.log('─────────────────────────────────────────');
      console.log(aiResponse);
      console.log('─────────────────────────────────────────\n');

      if (autoReply) {
        // Send response automatically
        const sent = await sendResponse(page, aiResponse);

        if (sent) {
          await logInteraction(msg.buyerName, lastBuyerMessage.text, aiResponse);
          console.log('✅ Response sent and logged\n');
          await delay(3000); // Wait before processing next message
        }
      } else {
        console.log('ℹ️  Auto-reply disabled. Run with autoReply=true to send automatically.\n');
        console.log('💡 To send this response, copy it and paste into Fiverr manually.\n');
      }
    }

    if (!autoReply) {
      console.log('⏸️  Browser will stay open for manual review.');
      console.log('   Close the browser window when done.\n');
      // Keep browser open
      await new Promise(() => {});
    } else {
      await browser.close();
    }

  } catch (error) {
    console.error('❌ Error:', error);
    await browser.close();
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoReply = process.argv[2] === '--auto-reply';

  if (autoReply) {
    console.log('⚠️  AUTO-REPLY ENABLED: Will send responses automatically\n');
  } else {
    console.log('ℹ️  REVIEW MODE: Will generate responses but not send automatically');
    console.log('   Add --auto-reply flag to enable automatic sending\n');
  }

  runMessageResponder(autoReply)
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { runMessageResponder };
