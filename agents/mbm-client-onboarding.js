/**
 * MODERN BUSINESS MUM - AUTOMATED CLIENT ONBOARDING
 * End-to-end automation: signup → workspace setup → welcome → first value
 * Gets clients to "aha moment" within 48 hours
 */

import { createClient } from '@supabase/supabase-js';
import { MBMChiefOfStaff } from './mbm-chief-of-staff.js';
import { generateText } from '../lib/ai.js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Complete Onboarding Automation
 */
class MBMClientOnboarding {
  /**
   * Step 1: Process new signup
   */
  static async processSignup(signupData) {
    console.log('\n🚀 STARTING MODERN BUSINESS MUM CLIENT ONBOARDING\n');
    console.log(`Client: ${signupData.business_name}`);
    console.log(`Email: ${signupData.contact_email}\n`);

    // Create client record
    const { data: client, error } = await supabase
      .from('mbm_clients')
      .insert({
        business_name: signupData.business_name,
        contact_email: signupData.contact_email,
        monthly_revenue: signupData.monthly_revenue,
        team_size: signupData.team_size,
        biggest_challenge: signupData.biggest_challenge,
        subscription_status: 'trial',
        subscription_start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating client:', error);
      throw error;
    }

    console.log(`✅ Client created: ${client.id}\n`);

    // Trigger all onboarding steps in parallel
    await Promise.all([
      this.sendWelcomeEmail(client),
      this.setupWorkspace(client),
      this.scheduleKickoffCall(client),
      this.assignAITeam(client),
    ]);

    // Send summary to you
    await this.notifyTeam(client);

    console.log('\n✅ ONBOARDING COMPLETE!\n');
    return client;
  }

  /**
   * Step 2: Send welcome email with immediate value
   */
  static async sendWelcomeEmail(client) {
    console.log('📧 Sending welcome email...');

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2d3748; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .checklist { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist li { padding: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Your AI Operations Team!</h1>
      <p>Your $200k team is ready to work</p>
    </div>
    <div class="content">
      <p>Hi ${client.business_name} team,</p>

      <p>You just made the smartest operations decision of 2025.</p>

      <p>While your competitors are spending months hiring (and $200k+/year), you now have a fully-staffed operations team working 24/7 starting... right now.</p>

      <h2>🧠 Meet Your Team:</h2>
      <ul>
        <li><strong>AI Chief of Staff</strong> - Already organizing your workspace</li>
        <li><strong>AI Project Manager</strong> - Ready to track everything</li>
        <li><strong>AI Business Analyst</strong> - Preparing your first report</li>
        <li><strong>Your COO (Kristi)</strong> - Scheduling our strategy call</li>
      </ul>

      <h2>📋 Next 48 Hours:</h2>
      <div class="checklist">
        <ul>
          <li>✓ Your workspace is being set up automatically</li>
          <li>✓ AI Chief of Staff is learning your business</li>
          <li>✓ First weekly report generates in 7 days</li>
          <li>→ Strategy call scheduled (check your calendar)</li>
        </ul>
      </div>

      <a href="mailto:geminimummy5@gmail.com" class="button">Reply with Questions</a>

      <p><strong>Pro Tip:</strong> Start by asking your AI Chief of Staff: "What should I focus on this week?" You'll get an instant, data-driven answer.</p>

      <p>Talk soon,<br>
      Kristi<br>
      Modern Business Mum<br>
      Your Fractional COO</p>

      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e2e8f0;">

      <p style="font-size: 0.9rem; color: #718096;">
        <strong>Your trial includes:</strong> Full AI team access, monthly strategy call, unlimited support, 30-day money-back guarantee.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: 'Modern Business Mum <onboarding@modernbusinessmum.com>',
        to: client.contact_email,
        subject: `🎉 ${client.business_name} - Your AI Ops Team is Ready!`,
        html: emailHTML,
      });

      console.log('✅ Welcome email sent\n');
    } catch (error) {
      console.error('❌ Email failed:', error.message);
    }
  }

  /**
   * Step 3: Auto-setup workspace
   */
  static async setupWorkspace(client) {
    console.log('🗂️  Setting up workspace...');

    const chief = new MBMChiefOfStaff(client.id);

    // Create default SOPs
    await chief.manageSOP(
      'Daily Standup',
      '1. What did you accomplish yesterday?\n2. What are you working on today?\n3. Any blockers?',
      'Operations'
    );

    await chief.manageSOP(
      'Weekly Planning',
      '1. Review last week\'s goals\n2. Set this week\'s priorities\n3. Identify resource needs\n4. Update team',
      'Operations'
    );

    await chief.manageSOP(
      'Monthly Business Review',
      '1. Revenue vs target\n2. Key metrics analysis\n3. Win/loss analysis\n4. Next month priorities',
      'Strategy'
    );

    console.log('✅ Workspace configured with 3 SOPs\n');
  }

  /**
   * Step 4: Schedule kickoff call
   */
  static async scheduleKickoffCall(client) {
    console.log('📅 Scheduling kickoff call...');

    // Generate personalized agenda based on their challenge
    const prompt = `Create a 45-minute kickoff call agenda for a new Modern Business Mum client:

Business: ${client.business_name}
Biggest Challenge: ${client.biggest_challenge}
Team Size: ${client.team_size}

Include:
1. Welcome & introductions (5 min)
2. Deep dive on their biggest challenge (15 min)
3. Quick wins we can deliver this week (10 min)
4. Workspace walkthrough (10 min)
5. Q&A and next steps (5 min)

Make it specific to their challenge. Output as plain text.`;

    const agenda = await generateText(prompt, 'text');

    // Send calendar invite email
    const calendarEmail = `
Hi ${client.business_name} team,

Let's schedule our kickoff call!

**Agenda:**
${agenda}

**Reply with your preferred time:**
- Option 1: Tuesday 2pm EST
- Option 2: Wednesday 10am EST
- Option 3: Thursday 3pm EST

(Or suggest your own time)

Looking forward to it!

Kristi
Modern Business Mum
Your Fractional COO
`;

    try {
      await resend.emails.send({
        from: 'Modern Business Mum <onboarding@modernbusinessmum.com>',
        to: client.contact_email,
        subject: `Let's Schedule Your Strategy Call - ${client.business_name}`,
        html: calendarEmail.replace(/\n/g, '<br>'),
      });

      console.log('✅ Calendar invite sent\n');
    } catch (error) {
      console.error('❌ Calendar email failed:', error.message);
    }
  }

  /**
   * Step 5: Assign AI team
   */
  static async assignAITeam(client) {
    console.log('🤖 Assigning AI team...');

    const chief = new MBMChiefOfStaff(client.id);

    // AI Chief of Staff introduction
    const intro = await chief.processRequest(
      `Introduce yourself to ${client.business_name}. Tell them what you'll do for them and how to work with you. Be warm and helpful.`
    );

    console.log('✅ AI team assigned and ready\n');
    return intro;
  }

  /**
   * Step 6: Notify your team
   */
  static async notifyTeam(client) {
    console.log('📢 Notifying team...');

    const notification = `
🎉 NEW MODERN BUSINESS MUM CLIENT ONBOARDED!

Business: ${client.business_name}
Email: ${client.contact_email}
Revenue: ${client.monthly_revenue || 'Not provided'}
Team Size: ${client.team_size || 'Not provided'}
Challenge: ${client.biggest_challenge}

Status: Trial started
Started: ${new Date().toLocaleDateString()}

Next steps:
- [ ] Confirm kickoff call time
- [ ] Review their workspace in 48h
- [ ] First weekly report in 7 days
`;

    try {
      await resend.emails.send({
        from: 'Modern Business Mum <notifications@modernbusinessmum.com>',
        to: 'geminimummy5@gmail.com',
        subject: `🎉 New Client: ${client.business_name}`,
        html: notification.replace(/\n/g, '<br>'),
      });

      console.log('✅ Team notified\n');
    } catch (error) {
      console.error('❌ Notification failed:', error.message);
    }
  }

  /**
   * Day 7: First weekly report
   */
  static async sendFirstReport(clientId) {
    console.log('\n📊 Generating first weekly report...\n');

    const chief = new MBMChiefOfStaff(clientId);
    const report = await chief.generateDailyBriefing();

    // Store report
    const { data: client } = await supabase
      .from('mbm_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    await supabase.from('mbm_weekly_reports').insert({
      client_id: clientId,
      week_of: new Date().toISOString(),
      report_content: report,
      key_metrics: {},
      insights: [],
      recommendations: [],
    });

    // Email report
    await resend.emails.send({
      from: 'Modern Business Mum <reports@modernbusinessmum.com>',
      to: client.contact_email,
      subject: `📊 Your First Weekly Operations Report - ${client.business_name}`,
      html: `
<h1>Week 1 Report</h1>
<p>Here's what your AI Operations Team learned in your first week:</p>
<pre style="background: #f7fafc; padding: 20px; border-radius: 8px;">${report}</pre>
<p>Questions? Reply to this email!</p>
`,
    });

    console.log('✅ First report sent\n');
  }
}

/**
 * Test onboarding flow
 */
const testOnboarding = async () => {
  const testClient = {
    business_name: 'Test Company Inc',
    contact_email: 'geminimummy5@gmail.com',
    monthly_revenue: '$50k-100k',
    team_size: 10,
    biggest_challenge: 'Projects falling through the cracks, no visibility into what the team is working on',
  };

  console.log('🧪 TESTING MODERN BUSINESS MUM ONBOARDING FLOW\n');
  await MBMClientOnboarding.processSignup(testClient);
};

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOnboarding()
    .then(() => {
      console.log('\n✅ Onboarding test complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { MBMClientOnboarding };
