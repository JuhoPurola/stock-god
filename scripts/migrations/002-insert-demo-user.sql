-- Insert demo user if not exists
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;
