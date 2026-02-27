-- Manually insert Auth0 user
-- This is a temporary solution until we properly migrate the schema

-- First, let's see what the current state is
SELECT 'Current users:' as info;
SELECT id, email, name FROM users;

-- Insert the Auth0 user (this will fail if UUID constraint exists, which is expected)
-- We'll handle this in the next step
