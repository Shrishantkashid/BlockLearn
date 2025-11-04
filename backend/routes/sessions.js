const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const pool = require("../config/database");
const MatchingService = require("../utils/matchingService");

const router = express.Router();

// ✅ Get user sessions (both as student and mentor)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        s.id,
        s.scheduled_at,
        s.duration_minutes,
        s.status,
        s.meeting_link,
        s.location,
        s.notes,
        s.created_at,
        s.updated_at,
        -- Student info
        student.id as student_id,
        student.first_name as student_first_name,
        student.last_name as student_last_name,
        student.email as student_email,
        -- Mentor info
        mentor.id as mentor_id,
        mentor.first_name as mentor_first_name,
        mentor.last_name as mentor_last_name,
        mentor.email as mentor_email,
        -- Skill info
        skill.id as skill_id,
        skill.name as skill_name,
        skill.category as skill_category
      FROM sessions s
      JOIN users student ON s.student_id = student.id
      JOIN users mentor ON s.mentor_id = mentor.id
      JOIN skills skill ON s.skill_id = skill.id
      WHERE s.student_id = $1 OR s.mentor_id = $1
      ORDER BY s.scheduled_at DESC
    `;

    const result = await pool.query(query, [userId]);

    const sessions = result.rows.map(row => ({
      id: row.id,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      status: row.status,
      meeting_link: row.meeting_link,
      location: row.location,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student: {
        id: row.student_id,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
        email: row.student_email
      },
      mentor: {
        id: row.mentor_id,
        first_name: row.mentor_first_name,
        last_name: row.mentor_last_name,
        email: row.mentor_email
      },
      skill: {
        id: row.skill_id,
        name: row.skill_name,
        category: row.skill_category
      }
    }));

    res.json({
      success: true,
      data: sessions
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

    // Verify the mentor exists and offers the requested skill
    const mentorCheckQuery = `
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_skills us ON u.id = us.user_id
      WHERE u.id = $1 AND us.skill_id = $2 AND us.skill_type = 'offered'
    `;
    const mentorCheck = await pool.query(mentorCheckQuery, [mentor_id, skill_id]);

    if (mentorCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Mentor not found or doesn't offer the requested skill"
      });
    }

    // Verify the skill exists
    const skillCheckQuery = "SELECT id, name FROM skills WHERE id = $1";
    const skillCheck = await pool.query(skillCheckQuery, [skill_id]);

    if (skillCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Skill not found"
      });
    }

    // Create the session
    const insertQuery = `
      INSERT INTO sessions (
        student_id, mentor_id, skill_id, scheduled_at, duration_minutes,
        meeting_link, location, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      userId, mentor_id, skill_id, scheduled_at, duration_minutes,
      meeting_link, location, notes
    ]);

    const session = result.rows[0];
    const skill = skillCheck.rows[0];
    const mentor = mentorCheck.rows[0];

    // Record session outcome (initially connected = true since session was created)
    await MatchingService.recordSessionOutcome(session.id, true);

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: {
        id: session.id,
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
          id: mentor.id,
          first_name: mentor.first_name,
          last_name: mentor.last_name,
          email: mentor.email
        },
        skill: {
          id: skill.id,
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

    const query = `
      SELECT
        s.id,
        s.scheduled_at,
        s.duration_minutes,
        s.status,
        s.meeting_link,
        s.location,
        s.notes,
        s.created_at,
        s.updated_at,
        -- Student info
        student.id as student_id,
        student.first_name as student_first_name,
        student.last_name as student_last_name,
        student.email as student_email,
        -- Mentor info
        mentor.id as mentor_id,
        mentor.first_name as mentor_first_name,
        mentor.last_name as mentor_last_name,
        mentor.email as mentor_email,
        -- Skill info
        skill.id as skill_id,
        skill.name as skill_name,
        skill.category as skill_category
      FROM sessions s
      JOIN users student ON s.student_id = student.id
      JOIN users mentor ON s.mentor_id = mentor.id
      JOIN skills skill ON s.skill_id = skill.id
      WHERE s.id = $1 AND (s.student_id = $2 OR s.mentor_id = $2)
    `;

    const result = await pool.query(query, [session_id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        scheduled_at: row.scheduled_at,
        duration_minutes: row.duration_minutes,
        status: row.status,
        meeting_link: row.meeting_link,
        location: row.location,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        student: {
          id: row.student_id,
          first_name: row.student_first_name,
          last_name: row.student_last_name,
          email: row.student_email
        },
        mentor: {
          id: row.mentor_id,
          first_name: row.mentor_first_name,
          last_name: row.mentor_last_name,
          email: row.mentor_email
        },
        skill: {
          id: row.skill_id,
          name: row.skill_name,
          category: row.skill_category
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
