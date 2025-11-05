const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { connectDB } = require("../config/database");
const MatchingService = require("../utils/matchingService");

const router = express.Router();

// ✅ Get user sessions (both as student and mentor)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get database connection
    const db = await connectDB();
    
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

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');
    const sessionsCollection = db.collection('sessions');
    const userSkillsCollection = db.collection('user_skills');

    // Verify the mentor exists and offers the requested skill
    const mentor = await usersCollection.findOne({ _id: mentor_id });
    const mentorSkill = await userSkillsCollection.findOne({ 
      user_id: mentor_id, 
      skill_id: skill_id, 
      skill_type: 'offered' 
    });

    if (!mentor || !mentorSkill) {
      return res.status(400).json({
        success: false,
        message: "Mentor not found or doesn't offer the requested skill"
      });
    }

    // Verify the skill exists
    const skill = await skillsCollection.findOne({ _id: skill_id });

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: "Skill not found"
      });
    }

    // Create the session
    const newSession = {
      student_id: userId,
      mentor_id: mentor_id,
      skill_id: skill_id,
      scheduled_at: new Date(scheduled_at),
      duration_minutes: duration_minutes,
      status: 'scheduled',
      meeting_link: meeting_link,
      location: location,
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
      message: "Session created successfully",
      data: {
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
          id: userId,
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
    const db = await connectDB();
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');
    
    // Convert session_id to ObjectId if it's a string
    const sessionIdObj = typeof session_id === 'string' ? session_id : session_id;

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

module.exports = router;