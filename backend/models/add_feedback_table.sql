-- Add feedback_sessions table to existing database
-- Run this script to add the feedback functionality to your existing database

-- Session feedback table
CREATE TABLE IF NOT EXISTS feedback_sessions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
    student_feedback_type VARCHAR(20), -- 'positive', 'neutral', 'negative'
    student_comment TEXT,
    mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
    mentor_feedback_type VARCHAR(20), -- 'positive', 'neutral', 'negative'
    mentor_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for feedback_sessions
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_session_id ON feedback_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_student_rating ON feedback_sessions(student_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_mentor_rating ON feedback_sessions(mentor_rating);

-- Update existing sessions to have a default status if needed
UPDATE sessions SET status = 'completed' WHERE status IS NULL;

-- Add a column to track if a session has been matched using our algorithm
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS match_score DECIMAL(3,2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index for match score tracking
CREATE INDEX IF NOT EXISTS idx_sessions_match_score ON sessions(match_score);