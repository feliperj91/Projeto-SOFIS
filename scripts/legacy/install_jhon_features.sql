-- Migration to add columns for Jhon's features
-- Run this command inside your PostgreSQL database (e.g., via psql)

-- 1. Add inactive_contract column (JSONB)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inactive_contract JSONB DEFAULT NULL;

-- 2. Add web_laudo column (BOOLEAN)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS web_laudo BOOLEAN DEFAULT FALSE;

-- End of migration
