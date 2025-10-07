const express = require('express');
const cors = require('cors');
require('dotenv').config();

const OpenAI = require('openai');

const app = express();
const PORT = 5000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here', // Use environment variable in production
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test data
const testUsers = [
  { id: 1, email: 'student@test.com', first_name: 'John', last_name: 'Doe' },
  { id: 2, email: 'mentor@test.com', first_name: 'Jane', last_name: 'Smith' }
];

const testSessions = [
  {
    id: 1,
    student_id: 1,
    mentor_id: 2,
    skill_id: 1,
    scheduled_at: new Date().toISOString(),
    status: 'scheduled'
  }
];

const testSkills = [
  { id: 1, name: 'JavaScript', category: 'Programming' },
  { id: 2, name: 'Python', category: 'Programming' }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = testUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = 'test-token-' + user.id;
  res.json({
    success: true,
    token: token,
    user: user
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = testUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = 'test-token-' + user.id;
  res.json({
    success: true,
    token: token,
    user: user
  });
});

// Google OAuth
app.post('/api/auth/google', (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credential required' });
  }

  const token = 'google-token-' + Date.now();
  res.json({
    success: true,
    token: token,
    user: testUsers[0]
  });
});

// Get sessions
app.get('/api/sessions', (req, res) => {
  res.json({
    success: true,
    data: testSessions.map(session => ({
      ...session,
      student: testUsers.find(u => u.id === session.student_id),
      mentor: testUsers.find(u => u.id === session.mentor_id),
      skill: testSkills.find(s => s.id === session.skill_id)
    }))
  });
});

// Create session
app.post('/api/sessions', (req, res) => {
  const { mentor_id, skill_id, scheduled_at } = req.body;

  if (!mentor_id || !skill_id || !scheduled_at) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newSession = {
    id: testSessions.length + 1,
    student_id: 1,
    mentor_id: parseInt(mentor_id),
    skill_id: parseInt(skill_id),
    scheduled_at: scheduled_at,
    status: 'scheduled'
  };

  testSessions.push(newSession);
  res.status(201).json({ success: true, data: newSession });
});

// Chat message with GPT-4 integration
app.post('/api/chat/message', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    // Create a system prompt for BlockLearn context
    const systemPrompt = `You are a helpful assistant for BlockLearn, a peer-to-peer learning platform. You help users with:
    - Creating accounts and signing in
    - Finding mentors and booking sessions
    - Learning skills and teaching others
    - Understanding blockchain certificates
    - Using the dashboard and platform features

    Always be helpful, friendly, and provide clear, actionable guidance.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5-turbo for cost efficiency
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);

    // Fallback response if OpenAI fails
    const fallbackResponses = {
      'hello': "Hello! I'm your BlockLearn assistant. How can I help you today?",
      'help': "I can help you with creating accounts, finding mentors, booking sessions, managing skills, and understanding blockchain certificates. What do you need help with?",
      'signup': "To create an account, click 'Get Started' on the homepage and fill in your details!",
      'login': "To sign in, use the 'Login' button and enter your email and password.",
      'mentor': "You can find mentors by going to the 'Match' page and browsing by skills!",
    };

    const lowerMessage = message.toLowerCase();
    let fallbackResponse = "I'm here to help with BlockLearn! ";

    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        fallbackResponse = response;
        break;
      }
    }

    res.json({
      success: true,
      response: fallbackResponse + " (Note: AI service temporarily unavailable)",
      timestamp: new Date().toISOString()
    });
  }
});

// Feedback
app.post('/api/feedback', (req, res) => {
  const { sessionId, rating, comment } = req.body;

  if (!sessionId || !rating) {
    return res.status(400).json({ error: 'Session ID and rating required' });
  }

  res.json({
    success: true,
    message: 'Feedback submitted',
    data: { sessionId, rating, comment }
  });
});

// Blockchain verification
app.post('/api/blockchain/verify', (req, res) => {
  const { sessionId, skillId, userId } = req.body;

  if (!sessionId || !skillId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  res.status(201).json({
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    status: 'verified'
  });
});

// Get skills
app.get('/api/skills', (req, res) => {
  res.json({ success: true, data: testSkills });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path, method: req.method });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Test Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/google`);
  console.log(`   GET  /api/sessions`);
  console.log(`   POST /api/sessions`);
  console.log(`   POST /api/chat/message`);
  console.log(`   POST /api/feedback`);
  console.log(`   POST /api/blockchain/verify`);
  console.log(`   GET  /api/skills`);
});

module.exports = app;
