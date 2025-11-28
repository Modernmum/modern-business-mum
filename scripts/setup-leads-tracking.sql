-- LEADS TRACKING TABLE
-- Track demo requests, trial signups, and sales

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'demo', 'trial', 'sale'
  detail TEXT NOT NULL, -- Contact name or sale amount
  source TEXT, -- 'twitter', 'linkedin', 'reddit', 'email', 'direct'
  amount NUMERIC, -- For sales
  description TEXT, -- Additional details
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- View for conversion funnel
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
  COUNT(*) FILTER (WHERE type = 'demo') as demo_requests,
  COUNT(*) FILTER (WHERE type = 'trial') as trial_signups,
  COUNT(*) FILTER (WHERE type = 'sale') as sales,
  SUM(amount) FILTER (WHERE type = 'sale') as total_revenue,
  ROUND(
    COUNT(*) FILTER (WHERE type = 'trial')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE type = 'demo'), 0) * 100,
    1
  ) as demo_to_trial_rate,
  ROUND(
    COUNT(*) FILTER (WHERE type = 'sale')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE type = 'trial'), 0) * 100,
    1
  ) as trial_to_sale_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days';

-- View for daily activity
CREATE OR REPLACE VIEW daily_leads AS
SELECT
  DATE(created_at) as date,
  type,
  COUNT(*) as count,
  SUM(amount) as revenue
FROM leads
GROUP BY DATE(created_at), type
ORDER BY date DESC, type;
