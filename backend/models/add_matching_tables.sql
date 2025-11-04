-- Add matching tables to existing database
-- Run this script to add the matching functionality to your existing database

-- Match history table for ML training data
CREATE TABLE IF NOT EXISTS match_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    match_score DECIMAL(3,2), -- Normalized score between 0 and 1
    score_breakdown JSONB, -- Detailed breakdown of scoring factors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session outcomes table for ML training data
CREATE TABLE IF NOT EXISTS session_outcomes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    connected BOOLEAN, -- Whether the match led to a connection
    feedback_data JSONB, -- Structured feedback data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for match history
CREATE INDEX IF NOT EXISTS idx_match_history_student_id ON match_history(student_id);
CREATE INDEX IF NOT EXISTS idx_match_history_mentor_id ON match_history(mentor_id);
CREATE INDEX IF NOT EXISTS idx_match_history_skill_id ON match_history(skill_id);
CREATE INDEX IF NOT EXISTS idx_match_history_score ON match_history(match_score);

-- Indexes for session outcomes
CREATE INDEX IF NOT EXISTS idx_session_outcomes_session_id ON session_outcomes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_outcomes_connected ON session_outcomes(connected);

-- Add match score to sessions table for tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS match_score DECIMAL(3,2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index for match score tracking
CREATE INDEX IF NOT EXISTS idx_sessions_match_score ON sessions(match_score);

-- Analyze the new tables
ANALYZE match_history;
ANALYZE session_outcomes;