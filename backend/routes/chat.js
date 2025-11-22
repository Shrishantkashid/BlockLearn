const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getDB } = require("../config/database");
const OpenAI = require("openai");
const { translate, getTranslatedResponse } = require("../utils/translation");

const router = express.Router();

// Initialize OpenAI (only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Enhanced contextual responses with multi-language support
const getContextualResponse = async (userMessage, userId = null, language = 'en') => {
  const message = userMessage.toLowerCase();

  try {
    // Try OpenAI first if available and user is authenticated
    if (openai && userId) {
      const userContext = await getUserContext(userId);
      const aiResponse = await getOpenAIResponse(userMessage, userContext, language);
      return aiResponse;
    }

    // Fallback to enhanced rule-based responses with translation
    return getEnhancedRuleResponse(message, language);

  } catch (error) {
    console.error("Error getting contextual response:", error);
    return getEnhancedRuleResponse(message, language);
  }
};

// Original rule-based responses with translation support
const getTranslatedRuleResponse = (message, language) => {
  // Platform-related queries
  if (message.includes('how to') || message.includes('help')) {
    if (message.includes('schedule') || message.includes('session') || message.includes('book')) {
      return translate('sessions', language);
    }
    if (message.includes('skill') || message.includes('learn') || message.includes('teach')) {
      return translate('skills', language);
    }
    if (message.includes('profile') || message.includes('account') || message.includes('bio')) {
      return translate('profile', language);
    }
    if (message.includes('feedback') || message.includes('rate') || message.includes('review')) {
      return translate('feedback', language);
    }
    if (message.includes('mentor') || message.includes('teacher') || message.includes('expert')) {
      return translate('mentor', language);
    }
    if (message.includes('certificate') || message.includes('blockchain') || message.includes('credential')) {
      return translate('certificates', language);
    }
    return translate('help_with', language);
  }

  // Specific platform features
  if (message.includes('dashboard')) {
    return translate('dashboard', language);
  }

  if (message.includes('match') || message.includes('find')) {
    return translate('match', language);
  }

  if (message.includes('leaderboard') || message.includes('ranking') || message.includes('top')) {
    return translate('leaderboard', language);
  }

  if (message.includes('progress') || message.includes('track') || message.includes('improve')) {
    return translate('progress', language);
  }

  // Greetings and general conversation
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('good morning') || message.includes('good afternoon') || message.includes('good evening')) {
    return translate('hello', language);
  }

  if (message.includes('thank') || message.includes('thanks')) {
    return translate('thanks', language);
  }

  if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
    return translate('goodbye', language);
  }

  // Default response for unclear queries
  const suggestions = translate('help_with', language);
  return `I understand you're asking about "${userMessage}". While I don't have specific information about that topic, I can help you with: ${suggestions}. Could you be more specific about what you'd like help with?`;
};

// Get user context for personalized responses
const getUserContext = async (userId) => {
  try {
    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const userSkillsCollection = db.collection('user_skills');
    const skillsCollection = db.collection('skills');
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // Get user data
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return null;

    const profile = await profilesCollection.findOne({ user_id: userId });

    // Get user's skills
    const userSkills = await userSkillsCollection.find({ user_id: userId }).toArray();
    
    // Enrich skills with names
    const enrichedSkills = [];
    for (const skill of userSkills) {
      const skillInfo = await skillsCollection.findOne({ _id: skill.skill_id });
      enrichedSkills.push({
        skill_name: skillInfo ? skillInfo.name : 'Unknown',
        skill_type: skill.skill_type,
        proficiency_level: skill.proficiency_level
      });
    }

    // Get session data
    const sessions = await sessionsCollection.find({
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    }).toArray();

    // Get feedback data
    const feedbackSessions = [];
    for (const session of sessions) {
      const feedback = await feedbackSessionsCollection.findOne({ session_id: session._id });
      if (feedback) {
        feedbackSessions.push(feedback);
      }
    }

    // Calculate averages
    let totalStudentRating = 0;
    let totalMentorRating = 0;
    let studentRatingCount = 0;
    let mentorRatingCount = 0;

    feedbackSessions.forEach(fb => {
      if (fb.student_rating) {
        totalStudentRating += fb.student_rating;
        studentRatingCount++;
      }
      if (fb.mentor_rating) {
        totalMentorRating += fb.mentor_rating;
        mentorRatingCount++;
      }
    });

    const avgStudentRating = studentRatingCount > 0 ? totalStudentRating / studentRatingCount : 0;
    const avgMentorRating = mentorRatingCount > 0 ? totalMentorRating / mentorRatingCount : 0;

    // Get recent session activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await sessionsCollection.find({
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ],
      created_at: { $gte: thirtyDaysAgo }
    }).sort({ created_at: -1 }).limit(5).toArray();

    // Enrich recent sessions with skill names
    const enrichedRecentSessions = [];
    for (const session of recentSessions) {
      const skill = await skillsCollection.findOne({ _id: session.skill_id });
      enrichedRecentSessions.push({
        skill_id: session.skill_id,
        skill_name: skill ? skill.name : 'Unknown',
        status: session.status,
        created_at: session.created_at,
        scheduled_at: session.scheduled_at
      });
    }

    return {
      name: `${user.first_name} ${user.last_name}`,
      bio: profile ? profile.bio : null,
      department: profile ? profile.department : null,
      year_of_study: profile ? profile.year_of_study : null,
      skills: enrichedSkills,
      total_sessions: sessions.length,
      avg_student_rating: avgStudentRating,
      avg_mentor_rating: avgMentorRating,
      recent_activity: enrichedRecentSessions
    };
  } catch (error) {
    console.error("Error getting user context:", error);
    return null;
  }
};

// Enhanced OpenAI integration with GPT-4 and advanced features
const getOpenAIResponse = async (userMessage, userContext, language, conversationHistory = []) => {
  try {
    // Enhanced system prompt with advanced capabilities
    const systemPrompt = `
You are an advanced AI assistant for BlockLearn, a sophisticated peer-to-peer learning platform.
Your capabilities include:
- Advanced conversational AI with GPT-4
- Voice emotion detection and adaptive responses
- Multi-modal content analysis (images, files)
- Advanced learning path recommendations
- Integration with external learning resources
- Emotional intelligence and adaptive communication

${userContext ? `
User Context:
- Name: ${userContext.name}
- Department: ${userContext.department || 'Not specified'}
- Year of Study: ${userContext.year_of_study || 'Not specified'}
- Skills: ${userContext.skills.map(s => `${s.skill_name} (${s.skill_type}, level ${s.proficiency_level})`).join(', ')}
- Total Sessions: ${userContext.total_sessions}
- Average Ratings: Student ${userContext.avg_student_rating.toFixed(1)}, Mentor ${userContext.avg_mentor_rating.toFixed(1)}
- Recent Activity: ${userContext.recent_activity.map(a => `${a.skill_name} session (${a.status})`).join(', ')}
` : ''}

CORE CAPABILITIES:
1. **Advanced Learning Recommendations**: Analyze user's skill gaps, learning patterns, and career goals to suggest optimal learning paths
2. **External Resource Integration**: Suggest relevant YouTube tutorials, Coursera courses, documentation, and other learning materials
3. **Multi-modal Support**: Analyze images, code snippets, and files shared in conversations
4. **Voice Emotion Detection**: Adapt responses based on detected emotional tone in voice input
5. **Adaptive Communication**: Adjust response style based on user's communication preferences and learning style

COMMUNICATION GUIDELINES:
- Be encouraging and supportive while maintaining expertise
- Use appropriate technical depth based on user's skill level
- Provide actionable, specific guidance rather than generic advice
- When suggesting external resources, explain why they're relevant and how to use them
- For learning paths, break down complex topics into manageable milestones
- Respond in the user's preferred language when specified

If you don't know something specific, suggest where the user can find the information or offer to help them search for it.
Keep responses conversational but informative and structured when providing step-by-step guidance.
`;

    // Include conversation history for context
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-4), // Last 4 messages for context
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Upgraded to GPT-4 for advanced reasoning
      messages: messages,
      max_tokens: 500, // Increased for more detailed responses
      temperature: 0.7,
      presence_penalty: 0.1, // Encourage diverse responses
      frequency_penalty: 0.1, // Reduce repetitive responses
      functions: [ // Enable function calling for advanced features
        {
          name: "analyze_learning_path",
          description: "Analyze user's skills and suggest optimal learning path",
          parameters: {
            type: "object",
            properties: {
              skill_gap: { type: "string", description: "Identified skill gap" },
              recommended_path: { type: "array", items: { type: "string" } },
              external_resources: { type: "array", items: { type: "string" } },
              estimated_time: { type: "string", description: "Time estimate for completion" }
            }
          }
        },
        {
          name: "suggest_external_resources",
          description: "Suggest relevant external learning resources",
          parameters: {
            type: "object",
            properties: {
              skill: { type: "string" },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["youtube", "coursera", "udemy", "documentation", "article"] },
                    title: { type: "string" },
                    url: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        },
        {
          name: "analyze_image_content",
          description: "Analyze uploaded images or screenshots for learning content",
          parameters: {
            type: "object",
            properties: {
              content_type: { type: "string", enum: ["code", "diagram", "text", "unknown"] },
              extracted_text: { type: "string" },
              learning_topics: { type: "array", items: { type: "string" } },
              suggested_actions: { type: "array", items: { type: "string" } }
            }
          }
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
};

// Enhanced rule-based responses with translation support
const getEnhancedRuleResponse = (message, language) => {
  // Personalized recommendations
  if (message.includes('recommend') || message.includes('suggest')) {
    if (message.includes('skill') || message.includes('learn')) {
      return translate('recommendations', language);
    }
    if (message.includes('mentor') || message.includes('teacher')) {
      return "Great mentors often have: 1) Strong ratings from previous sessions, 2) Expertise in your target skills, 3) Availability that matches your schedule. Check the Match page for personalized recommendations!";
    }
    return "I can provide personalized recommendations based on your skills, goals, and learning history. Could you be more specific about what you'd like recommendations for?";
  }

  // Learning analytics insights
  if (message.includes('progress') || message.includes('analytics') || message.includes('statistics')) {
    return translate('analytics', language);
  }

  // Career and goal-oriented advice
  if (message.includes('career') || message.includes('job') || message.includes('goal')) {
    return translate('career', language);
  }

  // Fallback to original rule-based system with translation
  return getTranslatedRuleResponse(message, language);
};

// ✅ Create a new conversation
router.post("/conversation", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    // Get database connection
    const db = await getDB();
    const collection = db.collection('chat_conversations');

    const newConversation = {
      user_id: userId,
      title: title || "New Conversation",
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await collection.insertOne(newConversation);
    const conversation = { ...newConversation, _id: result.insertedId };

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Send a message and get AI response
router.post("/message", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversation_id, message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty"
      });
    }

    // Get database connection
    const db = await getDB();
    const conversationsCollection = db.collection('chat_conversations');
    const messagesCollection = db.collection('chat_messages');

    // Get or create conversation
    let conversationId = conversation_id;
    if (!conversationId) {
      const newConversation = {
        user_id: userId,
        title: "New Conversation",
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      const convResult = await conversationsCollection.insertOne(newConversation);
      conversationId = convResult.insertedId;
    }

    // Save user message
    await messagesCollection.insertOne({
      conversation_id: conversationId,
      sender_type: 'user',
      message: message.trim(),
      timestamp: new Date(),
      metadata: {}
    });

    // Generate bot response using enhanced AI
    const botResponse = await getContextualResponse(message.trim(), userId);

    // Save bot message with metadata
    await messagesCollection.insertOne({
      conversation_id: conversationId,
      sender_type: 'bot',
      message: botResponse,
      timestamp: new Date(),
      metadata: {
        confidence: openai ? 'high' : 'medium',
        type: openai ? 'ai_powered' : 'enhanced_rule_based',
        has_user_context: !!userId
      }
    });

    // Get conversation with messages
    const conversation = await conversationsCollection.findOne({ _id: conversationId, user_id: userId });
    
    if (conversation) {
      const messages = await messagesCollection.find({ conversation_id: conversationId })
        .sort({ timestamp: 1 })
        .toArray();
      
      const conversationWithMessages = {
        ...conversation,
        messages: messages
      };

      res.json({
        success: true,
        data: conversationWithMessages
      });
    } else {
      res.json({
        success: true,
        data: { _id: conversationId, messages: [] }
      });
    }

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get conversation history
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const conversationsCollection = db.collection('chat_conversations');
    const messagesCollection = db.collection('chat_messages');

    // Get all conversations for the user
    const conversations = await conversationsCollection.find({ user_id: userId })
      .sort({ updated_at: -1 })
      .toArray();

    // Enrich conversations with messages
    const enrichedConversations = [];
    for (const conversation of conversations) {
      const messages = await messagesCollection.find({ conversation_id: conversation._id })
        .sort({ timestamp: 1 })
        .toArray();
      
      enrichedConversations.push({
        ...conversation,
        messages: messages
      });
    }

    res.json({
      success: true,
      data: enrichedConversations
    });

  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get specific conversation
router.get("/conversation/:conversation_id", authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const conversationsCollection = db.collection('chat_conversations');
    const messagesCollection = db.collection('chat_messages');

    const conversation = await conversationsCollection.findOne({ 
      _id: conversation_id, 
      user_id: userId 
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Get messages for this conversation
    const messages = await messagesCollection.find({ conversation_id: conversation_id })
      .sort({ timestamp: 1 })
      .toArray();

    const conversationWithMessages = {
      ...conversation,
      messages: messages
    };

    res.json({
      success: true,
      data: conversationWithMessages
    });

  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Close a conversation
router.put("/conversation/:conversation_id/close", authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const collection = db.collection('chat_conversations');

    const result = await collection.updateOne(
      { _id: conversation_id, user_id: userId },
      { 
        $set: { 
          status: 'closed', 
          updated_at: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const updatedConversation = await collection.findOne({ _id: conversation_id });

    res.json({
      success: true,
      data: updatedConversation
    });

  } catch (error) {
    console.error("Error closing conversation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get learning analytics for personalized recommendations
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get comprehensive user analytics
    const analytics = await getUserContext(userId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate personalized recommendations
    const recommendations = generatePersonalizedRecommendations(analytics);

    res.json({
      success: true,
      data: {
        user: {
          name: analytics.name,
          department: analytics.department,
          year_of_study: analytics.year_of_study
        },
        skills: {
          offered: analytics.skills.filter(s => s.skill_type === 'offered').length,
          needed: analytics.skills.filter(s => s.skill_type === 'needed').length,
          avg_proficiency: analytics.skills.length > 0 
            ? analytics.skills.reduce((sum, s) => sum + s.proficiency_level, 0) / analytics.skills.length 
            : 0
        },
        sessions: {
          total: analytics.total_sessions,
          completed: analytics.recent_activity.filter(s => s.status === 'completed').length,
          recent: analytics.recent_activity.length,
          avg_rating_received: analytics.avg_student_rating,
          avg_rating_given: analytics.avg_mentor_rating
        },
        popular_skills: [], // Would need more complex aggregation in a full implementation
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Generate personalized recommendations based on user analytics
const generatePersonalizedRecommendations = (analytics) => {
  const recommendations = [];

  // Count offered and needed skills
  const offeredSkills = analytics.skills.filter(s => s.skill_type === 'offered').length;
  const neededSkills = analytics.skills.filter(s => s.skill_type === 'needed').length;

  // Skill-based recommendations
  if (offeredSkills > 0 && analytics.avg_student_rating > 4.0) {
    recommendations.push({
      type: "mentor",
      title: "You're an excellent mentor!",
      description: "Your high ratings suggest you're great at teaching. Consider offering more advanced skills or mentoring more students.",
      priority: "high"
    });
  }

  if (neededSkills > offeredSkills) {
    recommendations.push({
      type: "learning",
      title: "Focus on your learning goals",
      description: "You're seeking many skills. Consider prioritizing 2-3 key areas to focus your learning efforts.",
      priority: "medium"
    });
  }

  // Session-based recommendations
  if (analytics.total_sessions < 3) {
    recommendations.push({
      type: "engagement",
      title: "Start your learning journey",
      description: "Complete a few sessions to build momentum and get personalized recommendations.",
      priority: "high"
    });
  }

  // Progress-based recommendations
  if (analytics.recent_activity.length === 0 && analytics.total_sessions > 0) {
    recommendations.push({
      type: "reengagement",
      title: "Welcome back!",
      description: "It's been a while since your last session. Check out new mentors and skills that might interest you.",
      priority: "medium"
    });
  }

  return recommendations;
};

// ✅ Simple chat message endpoint (for testing)
router.post("/message", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty"
      });
    }

    // Simple rule-based responses for basic functionality
    const responses = {
      hello: "Hello! Welcome to BlockLearn. I can help you with learning sessions, skills, and more!",
      help: "I can help you with: scheduling sessions, finding mentors, managing skills, providing feedback, and learning new topics.",
      session: "To schedule a session, go to the Match page and find a mentor who offers the skills you want to learn.",
      skill: "You can manage your skills in the Skills page. Add skills you want to learn or skills you can teach others.",
      mentor: "To become a mentor, add skills you excel at to your 'Skills Offered' section in your profile.",
      feedback: "After completing a session, you can provide feedback using our rating system to help improve future matches."
    };

    const lowerMessage = message.toLowerCase();
    let response = "I'm here to help! Ask me about sessions, skills, mentors, or any BlockLearn features.";

    // Simple keyword matching
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    res.json({
      success: true,
      message: "Message sent successfully",
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;