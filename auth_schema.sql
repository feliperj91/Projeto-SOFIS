-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In a real production app, this should be hashed
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (allow read for login check)
DROP POLICY IF EXISTS "Enable read access for login" ON users;
CREATE POLICY "Enable read access for login" ON users FOR SELECT USING (true);

-- Insert a default user if none exists (User: admin / Pass: sofis123)
-- The user can change this later in the database
INSERT INTO users (username, password, full_name)
VALUES ('admin', 'sofis123', 'Administrador Sofis')
ON CONFLICT (username) DO NOTHING;
