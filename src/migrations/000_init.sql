-- Migration tracking table (in 2026 schema)
-- Note: Schema should already exist or be created by migration 001
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS "2026".migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

