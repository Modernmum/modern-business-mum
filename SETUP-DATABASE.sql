-- ============================================================================
-- ZERO TO LEGACY ENGINE - COMPLETE DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- Opportunities discovered by Scout Agent
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trend_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'discovered',
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products created by Creator Agent
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    niche VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    features TEXT[],
    template_content JSONB,
    suggested_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings managed by Executor Agent
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url TEXT,
    price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'draft',
    sales INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fiverr messages (automated responses)
CREATE TABLE IF NOT EXISTS fiverr_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  inquiry_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_niche ON opportunities(niche);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_niche ON products(niche);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_platform ON listings(platform);
CREATE INDEX IF NOT EXISTS idx_system_logs_agent ON system_logs(agent);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_buyer ON fiverr_messages(buyer_name);
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_date ON fiverr_messages(responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_status ON fiverr_messages(status);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE opportunities IS 'Opportunities discovered by the Scout Agent';
COMMENT ON TABLE products IS 'Products created by the Creator Agent';
COMMENT ON TABLE listings IS 'Product listings managed by the Executor Agent';
COMMENT ON TABLE transactions IS 'Financial transactions and sales tracking';
COMMENT ON TABLE system_logs IS 'System activity logs for all agents';
COMMENT ON TABLE fiverr_messages IS 'Tracks automated Fiverr message responses';

-- ============================================================================
-- DONE!
-- ============================================================================

-- All tables created successfully
-- You can now run your automation agents
