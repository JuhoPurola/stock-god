-- Add portfolio_performance_metrics table for Phase 4 Analytics

CREATE TABLE IF NOT EXISTS portfolio_performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Basic returns
    total_return DECIMAL(15, 2) NOT NULL,
    total_return_percent DECIMAL(8, 4) NOT NULL,
    annualized_return DECIMAL(8, 4) NOT NULL,

    -- Risk metrics
    volatility DECIMAL(8, 4) NOT NULL,
    downside_deviation DECIMAL(8, 4) NOT NULL,
    max_drawdown DECIMAL(15, 2) NOT NULL,
    max_drawdown_percent DECIMAL(8, 4) NOT NULL,

    -- Risk-adjusted returns
    sharpe_ratio DECIMAL(8, 4),
    sortino_ratio DECIMAL(8, 4),
    calmar_ratio DECIMAL(8, 4),

    -- Value at Risk
    var_95 DECIMAL(15, 2),
    var_99 DECIMAL(15, 2),
    cvar_95 DECIMAL(15, 2),
    cvar_99 DECIMAL(15, 2),

    -- Trading metrics
    total_trades INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL(6, 4),
    profit_factor DECIMAL(10, 4),
    average_trade DECIMAL(15, 2),

    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint on portfolio + period
    UNIQUE (portfolio_id, period_start, period_end)
);

CREATE INDEX idx_portfolio_performance_metrics_portfolio_id ON portfolio_performance_metrics(portfolio_id);
CREATE INDEX idx_portfolio_performance_metrics_calculation_date ON portfolio_performance_metrics(calculation_date DESC);

-- Verification
SELECT 'Portfolio performance metrics table created successfully' AS status;
