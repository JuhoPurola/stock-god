-- Phase 3: Automated Trading Scheduler Migration
-- Adds scheduled job configuration and execution tracking tables

-- ============================================================================
-- Scheduled Jobs Configuration Table
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM (
        'strategy_execution',
        'order_status_check',
        'position_sync',
        'price_update',
        'portfolio_snapshot',
        'alert_price_check'
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
    schedule_expression VARCHAR(100) NOT NULL, -- EventBridge cron expression
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

-- ============================================================================
-- Job Execution History Table
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
    metadata JSONB, -- Job-specific data (e.g., portfolios processed, signals generated)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_type ON job_executions(job_type);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON job_executions(started_at DESC);

-- ============================================================================
-- Update trigger for scheduled_jobs
-- ============================================================================

CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert default job configurations
-- ============================================================================

INSERT INTO scheduled_jobs (job_type, schedule_expression, enabled) VALUES
    ('strategy_execution', 'cron(*/15 13-20 ? * MON-FRI *)', true),  -- Every 15 min, 9:30 AM - 4 PM ET (13:30-20:00 UTC)
    ('order_status_check', 'cron(* 13-20 ? * MON-FRI *)', true),     -- Every 1 min during market hours
    ('position_sync', 'cron(*/5 13-20 ? * MON-FRI *)', true),        -- Every 5 min during market hours
    ('price_update', 'cron(*/5 13-20 ? * MON-FRI *)', true),         -- Every 5 min during market hours
    ('portfolio_snapshot', 'cron(5 20 ? * MON-FRI *)', true),        -- 4:05 PM ET (20:05 UTC) end of day
    ('alert_price_check', 'cron(*/5 13-20 ? * MON-FRI *)', true)     -- Every 5 min during market hours
ON CONFLICT (job_type) DO NOTHING;

-- Verification
SELECT 'Phase 3 migration completed successfully' AS status;
SELECT COUNT(*) AS scheduled_jobs_count FROM scheduled_jobs;
SELECT job_type, schedule_expression, enabled FROM scheduled_jobs ORDER BY job_type;
