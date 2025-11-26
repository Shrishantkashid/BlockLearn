const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const MatchingService = require('../utils/matchingService');
const { sendSessionScheduledEmail } = require('../config/email');

const router = express.Router();

// ✅ Get user sessions (both as student and mentor)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    
    // Since MongoDB doesn't support JOINs, we'll need to fetch data in multiple queries
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');
    
    // Find sessions where user is either student or mentor
    const sessions = await sessionsCollection.find({
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    }).sort({ scheduled_at: -1 }).toArray();

    // Enrich sessions with user and skill data
    const enrichedSessions = [];
    for (const session of sessions) {
      // Get student info
      const student = await usersCollection.findOne({ _id: session.student_id });
      
      // Get mentor info
      const mentor = await usersCollection.findOne({ _id: session.mentor_id });
      
      // Get skill info
      const skill = await skillsCollection.findOne({ _id: session.skill_id });
      
      enrichedSessions.push({
        id: session._id,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        status: session.status,
        meeting_link: session.meeting_link,
        location: session.location,
        notes: session.notes,
        created_at: session.created_at,
        updated_at: session.updated_at,
        student: {
          id: student ? student._id : null,
          first_name: student ? student.first_name : null,
          last_name: student ? student.last_name : null,
          email: student ? student.email : null
        },
        mentor: {
          id: mentor ? mentor._id : null,
          first_name: mentor ? mentor.first_name : null,
          last_name: mentor ? mentor.last_name : null,
          email: mentor ? mentor.email : null
        },
        skill: {
          id: skill ? skill._id : null,
          name: skill ? skill.name : null,
          category: skill ? skill.category : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedSessions
    });

  } catch (error) {
    console.error("Error getting user sessions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Create new session
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      student_id,
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
        message: "Mentor ID, skill ID, and scheduled time are required"
      });
    }

    // Additional validation for field types
    if (typeof mentor_id !== 'string' || mentor_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID"
      });
    }
    
    if (typeof skill_id !== 'string' || skill_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID"
      });
    }

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');
    const sessionsCollection = db.collection('sessions');
    const userSkillsCollection = db.collection('user_skills');

    // Convert string IDs to ObjectId if needed
    const mentorIdObj = typeof mentor_id === 'string' ? new ObjectId(mentor_id) : mentor_id;
    const skillIdObj = typeof skill_id === 'string' ? new ObjectId(skill_id) : skill_id;

    // Verify the mentor exists and offers the requested skill
    const mentor = await usersCollection.findOne({ _id: mentorIdObj });
    const mentorSkill = await userSkillsCollection.findOne({ 
      user_id: mentorIdObj, 
      skill_id: skillIdObj, 
      skill_type: 'offered' 
    });

    if (!mentor || !mentorSkill) {
      return res.status(400).json({
        success: false,
        message: "Mentor not found or doesn't offer the requested skill"
      });
    }

    // Verify the skill exists
    const skill = await skillsCollection.findOne({ _id: skillIdObj });

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: "Skill not found"
      });
    }

    // Validate datetime format
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled time format"
      });
    }

    // Generate unique random code for the live session
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const liveSessionCode = generateUniqueCode();

    // Determine student_id - use provided student_id or default to current user
    const studentId = student_id || userId;

    // Create the session with live session code
    const newSession = {
      student_id: studentId,
      mentor_id: mentorIdObj,
      skill_id: skillIdObj,
      scheduled_at: scheduledDate,
      duration_minutes: duration_minutes || 60, // Default to 60 minutes
      status: 'scheduled',
      meeting_link: meeting_link,
      location: location || 'Online', // Default to 'Online' if not provided
      live_session_code: liveSessionCode,
      live_session_created_at: new Date(),
      notes: notes,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await sessionsCollection.insertOne(newSession);
    const session = { ...newSession, _id: result.insertedId };

    // Record session outcome (initially connected = true since session was created)
    await MatchingService.recordSessionOutcome(session._id, true);

    // Send email notifications to both learner and mentor with video call details
    try {
      // Get student info for email
      const student = await usersCollection.findOne({ _id: studentId });
      
      await sendSessionScheduledEmail(
        student.email,
        student.first_name,
        mentor.email,
        mentor.first_name,
        {
          skillName: skill.name,
          scheduledAt: session.scheduled_at,
          durationMinutes: session.duration_minutes,
          location: session.location,
          notes: session.notes,
          liveSessionCode: session.live_session_code,
          meetingLink: `http://localhost:5173/session/live/${session.live_session_code}`
        }
      );
    } catch (emailError) {
      console.error('Error sending session scheduled emails:', emailError);
      // Don't fail the session creation if email sending fails
    }

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: {
        id: session._id,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        status: session.status,
        meeting_link: session.meeting_link,
        location: session.location,
        live_session_code: session.live_session_code,
        notes: session.notes,
        created_at: session.created_at,
        updated_at: session.updated_at,
        student: {
          id: studentId,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          email: req.user.email
        },
        mentor: {
          id: mentor._id,
          first_name: mentor.first_name,
          last_name: mentor.last_name,
          email: mentor.email
        },
        skill: {
          id: skill._id,
          name: skill.name
        }
      }
    });

  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get specific session by ID
router.get("/:session_id", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');
    
    // Convert session_id to ObjectId if it's a string
    const sessionIdObj = typeof session_id === 'string' ? new ObjectId(session_id) : session_id;

    // Find session where user is either student or mentor
    const session = await sessionsCollection.findOne({
      _id: sessionIdObj,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    // Get student info
    const student = await usersCollection.findOne({ _id: session.student_id });
    
    // Get mentor info
    const mentor = await usersCollection.findOne({ _id: session.mentor_id });
    
    // Get skill info
    const skill = await skillsCollection.findOne({ _id: session.skill_id });

    res.json({
      success: true,
      data: {
        id: session._id,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        status: session.status,
        meeting_link: session.meeting_link,
        location: session.location,
        live_session_code: session.live_session_code,
        notes: session.notes,
        created_at: session.created_at,
        updated_at: session.updated_at,
        student: {
          id: student ? student._id : null,
          first_name: student ? student.first_name : null,
          last_name: student ? student.last_name : null,
          email: student ? student.email : null
        },
        mentor: {
          id: mentor ? mentor._id : null,
          first_name: mentor ? mentor.first_name : null,
          last_name: mentor ? mentor.last_name : null,
          email: mentor ? mentor.email : null
        },
        skill: {
          id: skill ? skill._id : null,
          name: skill ? skill.name : null,
          category: skill ? skill.category : null
        }
      }
    });

  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Generate live session code for immediate connection
router.post("/generate-live-code", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.body;
    const userId = req.user.id;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    
    // Convert session_id to ObjectId if it's a string
    const sessionIdObj = typeof session_id === 'string' ? new ObjectId(session_id) : session_id;
    
    // Verify the session exists and the user is part of it
    const session = await sessionsCollection.findOne({
      _id: sessionIdObj,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    // Generate unique random code for the live session
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const liveSessionCode = generateUniqueCode();

    // Store the live session code in the session
    await sessionsCollection.updateOne(
      { _id: sessionIdObj },
      { 
        $set: { 
          live_session_code: liveSessionCode,
          live_session_created_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: "Live session code generated successfully",
      data: {
        session_id: session._id,
        live_session_code: liveSessionCode,
        meeting_link: `http://localhost:5173/session/live/${liveSessionCode}`
      }
    });

  } catch (error) {
    console.error("Error generating live session code:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Validate live session code
router.get("/validate-live-code/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // Get database connection
    const db = await getDB();
    
    const sessionsCollection = db.collection('sessions');

    // Find session with the provided live session code
    const session = await sessionsCollection.findOne({ 
      live_session_code: code
    });

    if (!session) {
      console.log("Live session not found for code:", code);
      return res.status(404).json({
        success: false,
        message: "Invalid or expired live session code"
      });
    }

    // Check if the live session code is still valid (created within last 1 hour)
    const now = new Date();
    const codeCreatedAt = new Date(session.live_session_created_at);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (codeCreatedAt < oneHourAgo) {
      return res.status(400).json({
        success: false,
        message: "This live session code has expired"
      });
    }

    res.json({
      success: true,
      meetingLink: `http://localhost:5173/session/live/${session.live_session_code}`,
      liveSessionCode: session.live_session_code,
      createdAt: session.live_session_created_at
    });

  } catch (error) {
    console.error("Error validating live session code:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Create session from WebRTC chat (simplified version)
router.post("/webrtc-simple", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      mentor_id,
      student_id,
      scheduled_at,
      duration_minutes,
      location,
      notes
    } = req.body;

    if (!mentor_id || !student_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID, student ID, and scheduled time are required"
      });
    }

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const sessionsCollection = db.collection('sessions');

    // Validate that the current user is either the mentor or student
    if (userId !== mentor_id && userId !== student_id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create session for other users"
      });
    }

    // Verify the mentor and student exist
    const mentor = await usersCollection.findOne({ _id: new ObjectId(mentor_id) });
    const student = await usersCollection.findOne({ _id: new ObjectId(student_id) });

    if (!mentor || !student) {
      return res.status(400).json({
        success: false,
        message: "Mentor or student not found"
      });
    }

    // Validate datetime format
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled time format"
      });
    }

    // Generate unique random code for the live session
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const liveSessionCode = generateUniqueCode();

    // Create the session with live session code
    const newSession = {
      student_id: new ObjectId(student_id),
      mentor_id: new ObjectId(mentor_id),
      skill_id: null, // No skill ID required for WebRTC sessions
      scheduled_at: scheduledDate,
      duration_minutes: duration_minutes || 60, // Default to 60 minutes
      status: 'scheduled',
      location: location || 'Online', // Default to 'Online' if not provided
      live_session_code: liveSessionCode,
      live_session_created_at: new Date(),
      notes: notes,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await sessionsCollection.insertOne(newSession);
    const session = { ...newSession, _id: result.insertedId };

    // Record session outcome (initially connected = true since session was created)
    await MatchingService.recordSessionOutcome(session._id, true);

    res.status(201).json({
      success: true,
      message: "Session created successfully via WebRTC",
      data: {
        id: session._id,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        status: session.status,
        location: session.location,
        live_session_code: session.live_session_code,
        notes: session.notes,
        created_at: session.created_at,
        updated_at: session.updated_at,
        student: {
          id: student._id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email
        },
        mentor: {
          id: mentor._id,
          first_name: mentor.first_name,
          last_name: mentor.last_name,
          email: mentor.email
        }
      }
    });

  } catch (error) {
    console.error("Error creating session via WebRTC:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Complete session
router.post("/complete/:session_id", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user.id;
    const { rating, review, complaint } = req.body;

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    const feedbackCollection = db.collection('feedback');
    
    // Convert session_id to ObjectId if it's a string
    const sessionIdObj = typeof session_id === 'string' ? new ObjectId(session_id) : session_id;

    // Find session where user is either student or mentor
    const session = await sessionsCollection.findOne({
      _id: sessionIdObj,
      $or: [
        { student_id: new ObjectId(userId) },
        { mentor_id: new ObjectId(userId) }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    // Update session status to completed
    await sessionsCollection.updateOne(
      { _id: sessionIdObj },
      { 
        $set: { 
          status: 'completed',
          updated_at: new Date()
        }
      }
    );

    // If rating is provided and user is the student, save feedback
    if (rating && userId === session.student_id.toString()) {
      const feedbackData = {
        session_id: sessionIdObj,
        student_id: new ObjectId(userId),
        mentor_id: session.mentor_id,
        rating: rating,
        review: review || '',
        complaint: complaint || '',
        created_at: new Date(),
        updated_at: new Date()
      };

      await feedbackCollection.insertOne(feedbackData);
      
      // Update mentor's average rating
      const feedbackRecords = await feedbackCollection.find({ 
        mentor_id: session.mentor_id 
      }).toArray();
      
      const totalRating = feedbackRecords.reduce((sum, record) => sum + record.rating, 0);
      const averageRating = feedbackRecords.length > 0 ? totalRating / feedbackRecords.length : 0;
      
      // Update mentor's rating in users collection
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: session.mentor_id },
        { 
          $set: { 
            average_rating: averageRating,
            total_sessions: feedbackRecords.length
          }
        }
      );
    }

    res.json({
      success: true,
      message: "Session completed successfully"
    });

  } catch (error) {
    console.error("Error completing session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get mentor leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    // Find mentors with highest ratings and most sessions
    const mentors = await usersCollection.find({ 
      user_type: 'mentor',
      $or: [
        { average_rating: { $exists: true } },
        { total_sessions: { $exists: true } }
      ]
    })
    .sort({ average_rating: -1, total_sessions: -1 })
    .limit(10)
    .toArray();

    res.json({
      success: true,
      data: mentors.map(mentor => ({
        id: mentor._id,
        first_name: mentor.first_name,
        last_name: mentor.last_name,
        email: mentor.email,
        average_rating: mentor.average_rating || 0,
        total_sessions: mentor.total_sessions || 0
      }))
    });

  } catch (error) {
    console.error("Error getting mentor leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;