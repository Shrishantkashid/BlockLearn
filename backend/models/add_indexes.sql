-- Add indexes for better query performance
-- Run this after creating the initial schema

-- Index on users email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on email_verifications for OTP lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Index on user_profiles for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Index on user_skills for faster skill matching
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_type ON user_skills(skill_type);

-- Index on skills name for searching
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_skills_user_type ON user_skills(user_id, skill_type);

-- Indexes for feedback_sessions
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_session_id ON feedback_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_student_rating ON feedback_sessions(student_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_mentor_rating ON feedback_sessions(mentor_rating);

-- Indexes for match history
CREATE INDEX IF NOT EXISTS idx_match_history_student_id ON match_history(student_id);
CREATE INDEX IF NOT EXISTS idx_match_history_mentor_id ON match_history(mentor_id);
CREATE INDEX IF NOT EXISTS idx_match_history_skill_id ON match_history(skill_id);
CREATE INDEX IF NOT EXISTS idx_match_history_score ON match_history(match_score);

-- Indexes for session outcomes
CREATE INDEX IF NOT EXISTS idx_session_outcomes_session_id ON session_outcomes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_outcomes_connected ON session_outcomes(connected);

ANALYZE users;
ANALYZE email_verifications;
ANALYZE user_profiles;
ANALYZE skills;
ANALYZE user_skills;
ANALYZE feedback_sessions;
ANALYZE match_history;
ANALYZE session_outcomes;
