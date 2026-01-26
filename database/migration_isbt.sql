-- Migration to add ISBT 128 fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS isbt_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_collection_point BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS collection_points JSONB DEFAULT '[]'::jsonb;
