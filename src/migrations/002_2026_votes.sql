-- Migration: 002_2026_votes
-- Description: Add votes table for Christmas tree voting

CREATE TABLE IF NOT EXISTS "2026".votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "2026".users(id),
  goal_id VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, position),
  UNIQUE(user_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_2026_votes_user_id ON "2026".votes(user_id);
CREATE INDEX IF NOT EXISTS idx_2026_votes_goal_id ON "2026".votes(goal_id);

