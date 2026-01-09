-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Stores the Bcrypt hash
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (allow read for login check)
DROP POLICY IF EXISTS "Enable read access for login" ON users;
CREATE POLICY "Enable read access for login" ON users FOR SELECT USING (true);

-- Insert a default user if none exists (User: admin / Pass: password)
-- The user can change this later in the database
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Sofis', 'ADMINISTRADOR')
ON CONFLICT (username) DO NOTHING;
