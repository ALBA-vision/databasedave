-- Migration tracking table (in public schema)
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

