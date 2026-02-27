-- Migration: Change user IDs from UUID to VARCHAR to support Auth0
-- WARNING: This will delete existing user data

BEGIN;

-- Drop all foreign key constraints that reference users(id)
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey;
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_user_id_fkey;

-- Clear existing data (demo data only)
TRUNCATE TABLE alerts CASCADE;
TRUNCATE TABLE portfolio_snapshots CASCADE;
TRUNCATE TABLE backtest_trades CASCADE;
TRUNCATE TABLE backtests CASCADE;
TRUNCATE TABLE trades CASCADE;
TRUNCATE TABLE positions CASCADE;
TRUNCATE TABLE strategies CASCADE;
TRUNCATE TABLE portfolios CASCADE;
TRUNCATE TABLE users CASCADE;

-- Alter users table
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255);

-- Alter related tables
ALTER TABLE portfolios ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE alerts ALTER COLUMN user_id TYPE VARCHAR(255);

-- Recreate foreign key constraints
ALTER TABLE portfolios
    ADD CONSTRAINT portfolios_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE alerts
    ADD CONSTRAINT alerts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;
