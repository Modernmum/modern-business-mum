-- OPPORTUNITY SCANNER DATABASE SCHEMA
-- Stores opportunities found by autonomous scanner

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- reddit, google_trends, product_hunt, indie_hackers, micro_acquire
  title TEXT NOT NULL,
  description JSONB NOT NULL, -- Full opportunity data
  score INTEGER, -- 0-100 viability score
  speed_to_market INTEGER, -- Days to launch
  revenue_potential INTEGER, -- Monthly revenue estimate
  competition TEXT, -- low, medium, high
  product_type TEXT, -- notion_template, ai_agent, info_product, saas, acquisition
  action TEXT, -- build, acquire, pass
  status TEXT DEFAULT 'discovered', -- discovered, building, launched, killed, acquired
  created_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,
  launched_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_action ON opportunities(action);
CREATE INDEX IF NOT EXISTS idx_opportunities_source ON opportunities(source);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities(created_at DESC);

-- View for top opportunities
CREATE OR REPLACE VIEW top_opportunities AS
SELECT
  id,
  source,
  title,
  score,
  speed_to_market,
  revenue_potential,
  competition,
  product_type,
  action,
  status,
  created_at
FROM opportunities
WHERE status = 'discovered'
  AND action IN ('build', 'acquire')
ORDER BY score DESC
LIMIT 50;

-- View for opportunity analytics
CREATE OR REPLACE VIEW opportunity_analytics AS
SELECT
  source,
  COUNT(*) as total_found,
  COUNT(*) FILTER (WHERE action = 'build') as recommended_builds,
  COUNT(*) FILTER (WHERE action = 'acquire') as recommended_acquisitions,
  COUNT(*) FILTER (WHERE status = 'launched') as launched,
  COUNT(*) FILTER (WHERE status = 'killed') as killed,
  AVG(score) as avg_score,
  AVG(revenue_potential) as avg_revenue_potential
FROM opportunities
GROUP BY source
ORDER BY total_found DESC;

-- MVP Builds Tracking
CREATE TABLE IF NOT EXISTS mvp_builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id),
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  build_cost INTEGER, -- Cost to build
  launch_date DATE,
  landing_page_url TEXT,
  status TEXT DEFAULT 'building', -- building, testing, scaling, profitable, killed
  created_at TIMESTAMP DEFAULT NOW()
);

-- MVP Performance Tracking
CREATE TABLE IF NOT EXISTS mvp_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mvp_id UUID REFERENCES mvp_builds(id),
  date DATE NOT NULL,
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  ad_spend NUMERIC DEFAULT 0,
  roi NUMERIC, -- revenue / ad_spend
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mvp_id, date)
);

-- Acquisition Targets Tracking
CREATE TABLE IF NOT EXISTS acquisition_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id),
  business_name TEXT NOT NULL,
  asking_price INTEGER,
  monthly_revenue INTEGER,
  monthly_profit INTEGER,
  multiple NUMERIC, -- asking_price / (monthly_profit * 12)
  listing_url TEXT,
  status TEXT DEFAULT 'reviewing', -- reviewing, due_diligence, negotiating, acquired, passed
  acquired_date DATE,
  actual_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Empire Portfolio View
CREATE OR REPLACE VIEW empire_portfolio AS
SELECT
  'MVP Build' as asset_type,
  mb.product_name as name,
  mb.status,
  mb.launch_date,
  COALESCE(SUM(mp.revenue), 0) as total_revenue,
  COALESCE(SUM(mp.ad_spend), 0) as total_spend,
  CASE
    WHEN SUM(mp.ad_spend) > 0 THEN SUM(mp.revenue) / SUM(mp.ad_spend)
    ELSE 0
  END as lifetime_roi
FROM mvp_builds mb
LEFT JOIN mvp_performance mp ON mp.mvp_id = mb.id
WHERE mb.status IN ('testing', 'scaling', 'profitable')
GROUP BY mb.id, mb.product_name, mb.status, mb.launch_date

UNION ALL

SELECT
  'Acquisition' as asset_type,
  at.business_name as name,
  at.status,
  at.acquired_date as launch_date,
  at.monthly_revenue * 12 as total_revenue,
  at.actual_price as total_spend,
  CASE
    WHEN at.actual_price > 0 AND at.monthly_profit > 0
    THEN (at.monthly_profit * 12) / NULLIF(at.actual_price, 0)
    ELSE 0
  END as lifetime_roi
FROM acquisition_targets at
WHERE at.status = 'acquired';

-- Daily Performance Summary
CREATE OR REPLACE VIEW daily_empire_performance AS
SELECT
  date,
  COUNT(DISTINCT mvp_id) as active_mvps,
  SUM(visitors) as total_visitors,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  SUM(ad_spend) as total_ad_spend,
  CASE
    WHEN SUM(ad_spend) > 0 THEN SUM(revenue) / SUM(ad_spend)
    ELSE 0
  END as daily_roi
FROM mvp_performance
GROUP BY date
ORDER BY date DESC;
