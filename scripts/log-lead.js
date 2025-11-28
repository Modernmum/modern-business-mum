/**
 * LEAD LOGGER
 * Quick script to log demo requests, trials, and conversions
 *
 * Usage:
 *   node scripts/log-lead.js demo "John from Acme Corp" email
 *   node scripts/log-lead.js trial "Sarah from Tech Inc" linkedin
 *   node scripts/log-lead.js sale "500" "AI Ops Team - Monthly subscription"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const [, , type, detail, source] = process.argv;

if (!type || !detail) {
  console.log('\n❌ Missing required arguments\n');
  console.log('Usage:');
  console.log('  Log demo request:   node scripts/log-lead.js demo "John from Acme Corp" email');
  console.log('  Log trial signup:   node scripts/log-lead.js trial "Sarah from Tech Inc" linkedin');
  console.log('  Log sale:           node scripts/log-lead.js sale "500" "AI Ops Team subscription"');
  console.log('');
  process.exit(1);
}

async function logLead() {
  console.log('\n📝 LOGGING LEAD\n');

  const leadData = {
    type,
    detail,
    source: source || 'unknown',
    created_at: new Date().toISOString()
  };

  // For sales, parse the amount
  if (type === 'sale') {
    const amount = parseFloat(detail);
    leadData.amount = amount;
    leadData.description = source || 'Sale';
  }

  console.log(`Type:   ${leadData.type}`);
  console.log(`Detail: ${leadData.detail}`);
  console.log(`Source: ${leadData.source}`);
  console.log(`Time:   ${new Date().toLocaleString()}\n`);

  // Store in a simple leads table (we'll create the schema if needed)
  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (error) {
    // Table might not exist yet - create it
    if (error.code === '42P01') {
      console.log('Creating leads table...\n');
      // Table will need to be created in Supabase manually
      console.log('Run this SQL in Supabase:');
      console.log(`
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  detail TEXT NOT NULL,
  source TEXT,
  amount NUMERIC,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
      `);
      console.log('');
      process.exit(1);
    }
    console.error('❌ Error logging lead:', error.message);
    process.exit(1);
  }

  console.log('✅ Lead logged successfully!');
  console.log(`📊 Lead ID: ${data.id}\n`);

  // Show quick stats
  const { data: stats } = await supabase
    .from('leads')
    .select('type')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (stats) {
    const counts = stats.reduce((acc, lead) => {
      acc[lead.type] = (acc[lead.type] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Last 7 days:');
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  console.log('');
  process.exit(0);
}

logLead();
