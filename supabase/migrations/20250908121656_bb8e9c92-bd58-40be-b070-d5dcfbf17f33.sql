-- Add base compliance setting to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS base_enabled boolean DEFAULT true;