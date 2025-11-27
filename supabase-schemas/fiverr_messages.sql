-- FIVERR MESSAGES TABLE
-- Logs all automated Fiverr message responses

CREATE TABLE IF NOT EXISTS fiverr_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  inquiry_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_buyer ON fiverr_messages(buyer_name);
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_date ON fiverr_messages(responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiverr_messages_status ON fiverr_messages(status);

-- Comments
COMMENT ON TABLE fiverr_messages IS 'Tracks automated Fiverr message responses';
COMMENT ON COLUMN fiverr_messages.buyer_name IS 'Name of the buyer who sent the message';
COMMENT ON COLUMN fiverr_messages.inquiry_text IS 'The buyer''s original message/question';
COMMENT ON COLUMN fiverr_messages.response_text IS 'AI-generated response sent to buyer';
COMMENT ON COLUMN fiverr_messages.status IS 'Status: sent, pending, failed';
