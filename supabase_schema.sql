-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    web_laudo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phones JSONB DEFAULT '[]',
    emails JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    environment TEXT NOT NULL,
    sql_server TEXT NOT NULL,
    notes TEXT,
    credentials JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vpns table
CREATE TABLE IF NOT EXISTS vpns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create urls table
CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    environment TEXT NOT NULL,
    system TEXT NOT NULL,
    bridge_data_access TEXT,
    bootstrap TEXT,
    exec_update TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpns ENABLE ROW LEVEL SECURITY;
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all access for anon" ON clients;
    DROP POLICY IF EXISTS "Enable all access for anon" ON contacts;
    DROP POLICY IF EXISTS "Enable all access for anon" ON servers;
    DROP POLICY IF EXISTS "Enable all access for anon" ON vpns;
    DROP POLICY IF EXISTS "Enable all access for anon" ON urls;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create robust policies for anonymous access
CREATE POLICY "Enable all access for anon" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON servers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON vpns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON urls FOR ALL USING (true) WITH CHECK (true);
