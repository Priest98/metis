-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (added to match SQLAlchemy model and auth needs)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free',
    wallet_address TEXT UNIQUE,
    wallet_private_key TEXT,
    wallet_balance DECIMAL(20, 8) DEFAULT 50.000000,
    external_wallet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    wallet_private_key TEXT NOT NULL,
    wallet_balance DECIMAL(20, 8) DEFAULT 10.000000,
    daily_budget DECIMAL(20, 8) DEFAULT 1.000000,
    spent_today DECIMAL(20, 8) DEFAULT 0.000000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    tx_hash TEXT UNIQUE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT DEFAULT 'USDC',
    sender_address TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_agents_wallet_address ON agents(wallet_address);


-- Signals table
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    stop_loss DECIMAL(20, 8) NOT NULL,
    take_profit DECIMAL(20, 8) NOT NULL,
    probability_score DECIMAL(5, 2),
    signal_score DECIMAL(3, 1),
    confidence_level TEXT,
    risk_rating TEXT,
    trade_explanation TEXT,
    position_sizing DECIMAL(5, 2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    pnl DECIMAL(20, 8),
    price_usdc DECIMAL(20, 6) DEFAULT 0.001000 -- Gated signal price (default $0.001)
);

-- Index for fast querying
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Link to user
    name TEXT NOT NULL,
    strategy_type TEXT NOT NULL,
    config JSONB,
    risk_management JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    creator_wallet TEXT DEFAULT '0x0000000000000000000000000000000000000000' -- Wallet for splits
);

-- Backtest results
CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5, 2),
    profit_factor DECIMAL(8, 2),
    sharpe_ratio DECIMAL(8, 2),
    max_drawdown DECIMAL(5, 2),
    total_return DECIMAL(8, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base with vector embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768),
    metadata JSONB,
    knowledge_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market data table (TimescaleDB hypertable candidate)
CREATE TABLE IF NOT EXISTS market_data (
    time TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    open DECIMAL(20, 8),
    high DECIMAL(20, 8),
    low DECIMAL(20, 8),
    close DECIMAL(20, 8),
    volume DECIMAL(20, 8),
    exchange TEXT,
    PRIMARY KEY (time, symbol)
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) AS similarity
    FROM knowledge_base
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- Create index for vector search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATIONS
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 0. Users Policies
CREATE POLICY "Allow public read access to users"
ON users FOR SELECT TO public USING (true);

CREATE POLICY "Allow users to update own profile"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow public registration of profiles"
ON users FOR INSERT TO public
WITH CHECK (true);

-- 1. Signals Policies
-- Gated signals should not be read directly from the database; only via the API
CREATE POLICY "Allow service role read access to signals"
ON signals FOR SELECT TO service_role USING (true);

-- Allow system/service role to insert or update signals
CREATE POLICY "Allow authenticated service role full access to signals"
ON signals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Strategies Policies
-- Allow users to read, update, or delete their own strategies
CREATE POLICY "Allow users to manage own strategies"
ON strategies FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert strategies
CREATE POLICY "Allow users to create strategies"
ON strategies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Backtest Results Policies
-- Allow users to read backtest results linked to their strategies
CREATE POLICY "Allow users to view own backtest results"
ON backtest_results FOR SELECT TO authenticated
USING (
    strategy_id IN (
        SELECT id FROM strategies WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to create backtest results
CREATE POLICY "Allow users to store own backtest results"
ON backtest_results FOR INSERT TO authenticated
WITH CHECK (
    strategy_id IN (
        SELECT id FROM strategies WHERE user_id = auth.uid()
    )
);

-- 4. Knowledge Base Policies
-- Allow public read access for search queries
CREATE POLICY "Allow public read access to knowledge base"
ON knowledge_base FOR SELECT TO public USING (true);

-- Only allow service role to write/ingest knowledge base documents
CREATE POLICY "Allow service role write access to knowledge base"
ON knowledge_base FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 5. Market Data Policies
-- Allow public read access to market data
CREATE POLICY "Allow public read access to market data"
ON market_data FOR SELECT TO public USING (true);

-- Allow service role full write/update access to market data
CREATE POLICY "Allow service role write access to market data"
ON market_data FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 6. Agents Policies
-- Allow authenticated users to view their own agents
CREATE POLICY "Allow users to view own agents"
ON agents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to manage their own agents
CREATE POLICY "Allow users to manage own agents"
ON agents FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow system/service role full access to agents
CREATE POLICY "Allow service role full access to agents"
ON agents FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 7. Transactions Policies
-- Allow authenticated users to view their own transaction history
CREATE POLICY "Allow users to view own transactions"
ON transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow system/service role full access to transactions
CREATE POLICY "Allow service role full access to transactions"
ON transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);
