-- Migration: 001_2026_auth
-- Description: Create 2026 schema and NextAuth tables

-- Create schema
CREATE SCHEMA IF NOT EXISTS "2026";

-- Users table
CREATE TABLE IF NOT EXISTS "2026".users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  email_verified TIMESTAMP WITH TIME ZONE,
  credits INTEGER DEFAULT 0,
  referred_by UUID REFERENCES "2026".users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (OAuth providers)
CREATE TABLE IF NOT EXISTS "2026".accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "2026".users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "2026".sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "2026".users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification tokens (for email verification)
CREATE TABLE IF NOT EXISTS "2026".verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_2026_accounts_user_id ON "2026".accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_2026_sessions_user_id ON "2026".sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_2026_sessions_token ON "2026".sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_2026_users_email ON "2026".users(email);
CREATE INDEX IF NOT EXISTS idx_2026_users_referred_by ON "2026".users(referred_by);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_2026_users_updated_at ON "2026".users;
CREATE TRIGGER update_2026_users_updated_at
  BEFORE UPDATE ON "2026".users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to accounts table
DROP TRIGGER IF EXISTS update_2026_accounts_updated_at ON "2026".accounts;
CREATE TRIGGER update_2026_accounts_updated_at
  BEFORE UPDATE ON "2026".accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

