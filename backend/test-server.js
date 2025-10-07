const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock data for testing (in-memory storage)
let users = [
  {
    id: 1,
    email: 'student@test.com',
    first_name: 'John',
    last_name: 'Doe',
    campus_verified: true,
    profile_complete: true
  },
  {
    id: 2,
    email: 'mentor@test.com',
    first_name: 'Jane',
    last_name: 'Smith',
    campus_verified: true,
    profile_complete: true
  }
];

let sessions = [
  {
    id: 1,
    student_id: 1,
    mentor_id: 2,
    skill_id: 1,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    duration_minutes: 60,
    status: 'scheduled',
    notes: 'Test session for JavaScript learning'
  }
];

let skills = [
  { id: 1, name: 'JavaScript', category: 'Programming' },
  { id: 2, name: 'Python', category: 'Programming' },
  { id: 3, name: 'React', category: 'Web Development' }
];

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    message: 'BlockLearn API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: 'test-mode'
  });
});

// ✅ Traditional email/password login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate mock JWT token
    const token = 'mock-jwt-token-' + user.id + '-' + Date.now();

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ✅ Google OAuth endpoint
app.post('/api/auth/google', (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Mock Google OAuth verification
    const mockUser = users[0]; // Use first user as mock
    const token = 'mock-google-jwt-token-' + mockUser.id + '-' + Date.now();

    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.first_name,
        lastName: mockUser.last_name,
        campusVerified: mockUser.campus_verified,
        profileComplete: mockUser.profile_complete,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed',
    });
  }
});

// ✅ Get user sessions
app.get('/api/sessions', (req, res) => {
  try {
    // Return all sessions for testing
    const sessionsWithDetails = sessions.map(session => ({
      id: session.id,
      scheduled_at: session.scheduled_at,
      duration_minutes: session.duration_minutes,
      status: session.status,
      meeting_link: session.meeting_link,
      location: session.location,
      notes: session.notes,
      created_at: session.created_at,
      updated_at: session.updated_at,
      student: users.find(u => u.id === session.student_id),
      mentor: users.find(u => u.id === session.mentor_id),
      skill: skills.find(s => s.id === session.skill_id)
    }));

    res.json({
      success: true,
      data: sessionsWithDetails
    });

  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Create new session
app.post('/api/sessions', (req, res) => {
  try {
    const {
      mentor_id,
      skill_id,
      scheduled_at,
      duration_minutes,
      meeting_link,
      location,
      notes
    } = req.body;

    if (!mentor_id || !skill_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'Mentor ID, skill ID, and scheduled time are required'
      });
    }

    // Create new session
    const newSession = {
      id: sessions.length + 1,
      student_id: 1, // Default to first user for testing
      mentor_id: parseInt(mentor_id),
      skill_id: parseInt(skill_id),
      scheduled_at,
      duration_minutes,
      status: 'scheduled',
      meeting_link,
      location,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    sessions.push(newSession);

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: newSession
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Chat message endpoint
app.post('/api/chat/message', (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Simple rule-based responses for basic functionality
    const responses = {
      hello: 'Hello! Welcome to BlockLearn. I can help you with learning sessions, skills, and more!',
      help: 'I can help you with: scheduling sessions, finding mentors, managing skills, providing feedback, and learning new topics.',
      session: 'To schedule a session, go to the Match page and find a mentor who offers the skills you want to learn.',
      skill: 'You can manage your skills in the Skills page. Add skills you want to learn or skills you can teach others.',
      mentor: 'To become a mentor, add skills you excel at to your \'Skills Offered\' section in your profile.',
      feedback: 'After completing a session, you can provide feedback using our rating system to help improve future matches.'
    };

    const lowerMessage = message.toLowerCase();
    let response = 'I\'m here to help! Ask me about sessions, skills, mentors, or any BlockLearn features.';

    // Simple keyword matching
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || null
      }
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Feedback submission endpoint
app.post('/api/feedback', (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and rating are required'
      });
    }

    // Validate rating (1-5 scale)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        sessionId: sessionId,
        rating: rating,
        comment: comment || null,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Blockchain verification endpoint
app.post('/api/blockchain/verify', (req, res) => {
  try {
    const { sessionId, skillId, userId } = req.body;

    if (!sessionId || !skillId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, skill ID, and user ID are required'
      });
    }

    // Simulate blockchain verification
    const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
    const gasUsed = Math.floor(Math.random() * 100000) + 50000;

    res.status(201).json({
      success: true,
      message: 'Skill completion verified on blockchain',
      data: {
        sessionId: sessionId,
        skillId: skillId,
        userId: userId,
        transactionHash: transactionHash,
        blockNumber: blockNumber,
        gasUsed: gasUsed,
        verifiedAt: new Date().toISOString(),
        status: 'verified',
        certificateUrl: `https://blockchain.blocklearn.com/certificate/${transactionHash}`
      }
    });

  } catch (error) {
    console.error('Error verifying skill on blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Blockchain verification failed'
    });
  }
});

// ✅ Get skills list
app.get('/api/skills', (req, res) => {
  res.json({
    success: true,
    data: skills
  });
});

// Default root route
app.get('/', (req, res) => {
  res.send('BlockLearn Backend (Test Mode) is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BlockLearn Test Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend should be at: http://localhost:5173`);
  console.log(`🔧 Mode: Test Mode (No database required)`);
});

module.exports = app;
