-- Phase 2: Alert System Migration
-- Adds user_alert_preferences and price_alerts tables

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
-- Add updated_at trigger for new tables
-- ============================================================================

CREATE TRIGGER update_user_alert_preferences_updated_at
    BEFORE UPDATE ON user_alert_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification
SELECT 'Phase 2 migration completed successfully' AS status;
SELECT COUNT(*) AS user_alert_preferences_count FROM user_alert_preferences;
SELECT COUNT(*) AS price_alerts_count FROM price_alerts;
