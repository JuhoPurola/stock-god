-- Stock Picker Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- Portfolios Table
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE trading_mode AS ENUM ('paper', 'live');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    trading_mode trading_mode NOT NULL DEFAULT 'paper',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- ============================================================================
-- Strategies Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    factors JSONB NOT NULL, -- Array of FactorConfig objects
    risk_management JSONB NOT NULL, -- RiskManagementConfig object
    stock_universe TEXT[] NOT NULL, -- Array of stock symbols
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategies_portfolio_id ON strategies(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON strategies(enabled) WHERE enabled = true;

-- ============================================================================
-- Stocks Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    tradable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stocks_name ON stocks USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stocks_tradable ON stocks(tradable) WHERE tradable = true;

-- ============================================================================
-- Stock Prices Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(12, 4) NOT NULL,
    high DECIMAL(12, 4) NOT NULL,
    low DECIMAL(12, 4) NOT NULL,
    close DECIMAL(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_prices_symbol_timestamp ON stock_prices(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_prices_timestamp ON stock_prices(timestamp);

-- ============================================================================
-- Positions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    average_price DECIMAL(12, 4) NOT NULL,
    current_price DECIMAL(12, 4),
    market_value DECIMAL(15, 2),
    cost_basis DECIMAL(15, 2) NOT NULL,
    unrealized_pnl DECIMAL(15, 2),
    unrealized_pnl_percent DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);

-- ============================================================================
-- Trades Table
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'submitted', 'filled', 'partially_filled', 'cancelled', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    side order_side NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 4) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    order_type order_type NOT NULL,
    status order_status NOT NULL,
    signal JSONB, -- Signal object that triggered this trade
    broker_order_id VARCHAR(100),
    executed_at TIMESTAMP WITH TIME ZONE,
    commission DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_portfolio_id ON trades(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- ============================================================================
-- Portfolio Snapshots Table (for performance tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_balance DECIMAL(15, 2) NOT NULL,
    positions_value DECIMAL(15, 2) NOT NULL,
    position_count INTEGER DEFAULT 0,
    daily_return DECIMAL(15, 2),
    daily_return_percent DECIMAL(8, 4),
    total_return DECIMAL(15, 2),
    total_return_percent DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_timestamp ON portfolio_snapshots(portfolio_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_timestamp ON portfolio_snapshots(timestamp);

-- ============================================================================
-- Strategy Performance Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategy_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL(6, 4),
    total_pnl DECIMAL(15, 2) NOT NULL DEFAULT 0,
    average_win DECIMAL(15, 2),
    average_loss DECIMAL(15, 2),
    profit_factor DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(15, 2),
    max_drawdown_percent DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy_id ON strategy_performance(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_portfolio_id ON strategy_performance(portfolio_id);

-- ============================================================================
-- Portfolio Performance Metrics Table (Advanced Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Basic Returns
    total_return DECIMAL(15, 2),
    total_return_percent DECIMAL(10, 4),
    annualized_return DECIMAL(10, 4),

    -- Risk Metrics
    volatility DECIMAL(10, 4),
    downside_deviation DECIMAL(10, 4),
    max_drawdown DECIMAL(15, 2),
    max_drawdown_percent DECIMAL(10, 4),

    -- Risk-Adjusted Returns
    sharpe_ratio DECIMAL(10, 4),
    sortino_ratio DECIMAL(10, 4),
    calmar_ratio DECIMAL(10, 4),

    -- Value at Risk
    var_95 DECIMAL(15, 2),
    var_99 DECIMAL(15, 2),
    cvar_95 DECIMAL(15, 2),
    cvar_99 DECIMAL(15, 2),

    -- Trading Metrics
    total_trades INTEGER,
    win_rate DECIMAL(6, 4),
    profit_factor DECIMAL(10, 4),
    average_trade DECIMAL(15, 2),

    -- Benchmark Comparison (optional)
    benchmark_return DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    beta DECIMAL(10, 4),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_performance_metrics_unique
    ON portfolio_performance_metrics(portfolio_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_metrics_portfolio_id
    ON portfolio_performance_metrics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_metrics_date
    ON portfolio_performance_metrics(calculation_date DESC);

-- ============================================================================
-- Backtests Table
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE backtest_status AS ENUM ('running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS backtests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200),
    config JSONB NOT NULL, -- BacktestConfig object
    status backtest_status NOT NULL DEFAULT 'running',
    performance JSONB, -- StrategyPerformance object
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_status ON backtests(status);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at ON backtests(created_at DESC);

-- ============================================================================
-- Backtest Trades Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS backtest_trades (
    id BIGSERIAL PRIMARY KEY,
    backtest_id UUID NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    side order_side NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 4) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    signal JSONB NOT NULL, -- Signal object
    pnl DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_id ON backtest_trades(backtest_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_timestamp ON backtest_trades(timestamp);

-- ============================================================================
-- Alerts Table
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM (
        'trade_executed',
        'trade_failed',
        'stop_loss_triggered',
        'take_profit_triggered',
        'daily_loss_limit',
        'price_alert',
        'strategy_error'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_portfolio_id ON alerts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================================================
-- User Alert Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_alert_preferences (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    browser_notifications BOOLEAN NOT NULL DEFAULT true,
    trade_alerts BOOLEAN NOT NULL DEFAULT true,
    price_alerts BOOLEAN NOT NULL DEFAULT true,
    strategy_alerts BOOLEAN NOT NULL DEFAULT true,
    risk_alerts BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Price Alerts Table (User Watchlist)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE price_condition AS ENUM ('above', 'below', 'percent_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
    condition price_condition NOT NULL,
    target_price DECIMAL(12, 4),
    percent_change DECIMAL(5, 2),
    triggered BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    triggered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(user_id, active) WHERE active = true;

-- ============================================================================
-- API Rate Limits Table (for Alpha Vantage and other APIs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    call_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_name, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(api_name, endpoint, window_end);

-- ============================================================================
-- Functions
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON users;
DROP TRIGGER IF EXISTS update_trades_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_trades_updated_at ON strategies;
DROP TRIGGER IF EXISTS update_trades_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_trades_updated_at ON positions;
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON users;
DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON strategies;
DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON positions;
DROP TRIGGER IF EXISTS update_strategy_performance_updated_at ON strategy_performance;
CREATE TRIGGER update_strategy_performance_updated_at BEFORE UPDATE ON strategy_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON users;
DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON strategies;
DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON positions;
DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON api_rate_limits;
CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON api_rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views
-- ============================================================================

-- Portfolio summary view
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
    p.id,
    p.user_id,
    p.name,
    p.cash_balance,
    p.trading_mode,
    COALESCE(SUM(pos.market_value), 0) AS positions_value,
    p.cash_balance + COALESCE(SUM(pos.market_value), 0) AS total_value,
    COALESCE(SUM(pos.unrealized_pnl), 0) AS unrealized_pnl,
    COUNT(pos.id) AS position_count,
    p.created_at,
    p.updated_at
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id
GROUP BY p.id;

-- ============================================================================
-- Scheduled Jobs Configuration Table (Phase 3)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM (
        'strategy_execution',
        'order_status_check',
        'position_sync',
        'price_update',
        'portfolio_snapshot',
        'alert_price_check',
        'analytics_calculation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('enabled', 'disabled', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type job_type NOT NULL UNIQUE,
    schedule_expression VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    last_execution_status job_status NOT NULL DEFAULT 'enabled',
    last_execution_error TEXT,
    execution_count BIGINT NOT NULL DEFAULT 0,
    failure_count BIGINT NOT NULL DEFAULT 0,
    average_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_enabled ON scheduled_jobs(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(job_type);

CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Job Execution History Table (Phase 3)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE execution_status AS ENUM ('started', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS job_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type job_type NOT NULL,
    status execution_status NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_type ON job_executions(job_type);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON job_executions(started_at DESC);

-- ============================================================================
-- Seed Data
-- ============================================================================

-- Insert demo user if not exists
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Insert default job configurations
INSERT INTO scheduled_jobs (job_type, schedule_expression, enabled) VALUES
    ('strategy_execution', 'cron(*/15 13-20 ? * MON-FRI *)', true),
    ('order_status_check', 'cron(* 13-20 ? * MON-FRI *)', true),
    ('position_sync', 'cron(*/5 13-20 ? * MON-FRI *)', true),
    ('price_update', 'cron(*/5 13-20 ? * MON-FRI *)', true),
    ('portfolio_snapshot', 'cron(5 20 ? * MON-FRI *)', true),
    ('alert_price_check', 'cron(*/5 13-20 ? * MON-FRI *)', true)
ON CONFLICT (job_type) DO NOTHING;
