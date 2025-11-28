-- LEGAL TRAFFIC CAMPAIGNS TABLE
-- Tracks all automated posting to legal channels only

CREATE TABLE IF NOT EXISTS traffic_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  channels_used TEXT[] NOT NULL, -- ['twitter', 'pinterest', 'reddit', 'blog']
  results JSONB NOT NULL, -- Detailed results from each channel
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying campaigns
CREATE INDEX IF NOT EXISTS idx_traffic_campaigns_product ON traffic_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_traffic_campaigns_created ON traffic_campaigns(created_at DESC);

-- View for campaign analytics
CREATE OR REPLACE VIEW traffic_analytics AS
SELECT
  product_id,
  COUNT(*) as total_campaigns,
  array_agg(DISTINCT unnest(channels_used)) as all_channels_used,
  MAX(created_at) as last_campaign_date
FROM traffic_campaigns
GROUP BY product_id;
