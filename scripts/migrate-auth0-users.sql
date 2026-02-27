-- Migration: Support Auth0 User IDs (VARCHAR instead of UUID)
-- This migration changes the users.id column to support Auth0 user IDs

BEGIN;

-- Step 1: Create a temporary column for the new ID type
ALTER TABLE users ADD COLUMN new_id VARCHAR(255);

-- Step 2: Drop foreign key constraints
ALTER TABLE portfolios DROP CONSTRAINT portfolios_user_id_fkey;

-- Step 3: Drop the old id column and rename new_id to id
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN new_id TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 4: Change user_id columns in related tables to VARCHAR
ALTER TABLE portfolios ALTER COLUMN user_id TYPE VARCHAR(255);

-- Step 5: Recreate foreign key constraints
ALTER TABLE portfolios
    ADD CONSTRAINT portfolios_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Recreate indexes
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);

COMMIT;
