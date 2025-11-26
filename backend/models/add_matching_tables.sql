-- Add session_requests table for chat-based session booking
CREATE TABLE IF NOT EXISTS session_requests (
    id VARCHAR(36) PRIMARY KEY,
    student_id INTEGER NOT NULL,
    mentor_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'scheduled') DEFAULT 'pending',
    proposed_times JSON,
    accepted_time DATETIME,
    chat_room_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Add chat_messages table for session request discussions
CREATE TABLE IF NOT EXISTS session_request_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_request_id VARCHAR(36),
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'proposal', 'system', 'jitsi_link') DEFAULT 'text',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_request_id) REFERENCES session_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add video_call_sessions table for Jitsi integration
CREATE TABLE IF NOT EXISTS video_call_sessions (
    id VARCHAR(36) PRIMARY KEY,
    session_request_id VARCHAR(36),
    jitsi_room_name VARCHAR(255) UNIQUE,
    meeting_link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (session_request_id) REFERENCES session_requests(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_requests_student ON session_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_mentor ON session_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_request_messages_request ON session_request_messages(session_request_id);
CREATE INDEX IF NOT EXISTS idx_session_request_messages_sender ON session_request_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_request ON video_call_sessions(session_request_id);