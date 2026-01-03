-- Create version_controls table
CREATE TABLE IF NOT EXISTS version_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    environment TEXT NOT NULL CHECK (environment IN ('homologacao', 'producao')),
    system TEXT NOT NULL CHECK (system IN ('CellVida', 'Hemote Plus', 'Hemote Web', 'Monetário')),
    version TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    has_alert BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create version_history table
CREATE TABLE IF NOT EXISTS version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_control_id UUID REFERENCES version_controls(id) ON DELETE CASCADE,
    previous_version TEXT,
    new_version TEXT NOT NULL,
    updated_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE version_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all access for anon" ON version_controls;
    DROP POLICY IF EXISTS "Enable all access for anon" ON version_history;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create robust policies for anonymous access
CREATE POLICY "Enable all access for anon" ON version_controls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon" ON version_history FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_version_controls_client_id ON version_controls(client_id);
CREATE INDEX IF NOT EXISTS idx_version_controls_environment ON version_controls(environment);
CREATE INDEX IF NOT EXISTS idx_version_controls_system ON version_controls(system);
CREATE INDEX IF NOT EXISTS idx_version_controls_updated_at ON version_controls(updated_at);
CREATE INDEX IF NOT EXISTS idx_version_history_version_control_id ON version_history(version_control_id);
