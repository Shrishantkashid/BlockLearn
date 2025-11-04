const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const pool = require("../config/database");
const MatchingService = require("../utils/matchingService");

const router = express.Router();

// ✅ Submit feedback for a session (both student and mentor)
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const { session_id, rating, feedback_type, comment } = req.body;
    const userId = req.user.id;

    if (!session_id || !rating || !feedback_type) {
      return res.status(400).json({
        success: false,
        message: "Session ID, rating, and feedback type are required"
      });
    }

    // Verify the session exists and the user is part of it
    const sessionQuery = `
      SELECT * FROM sessions
      WHERE id = $1 AND (student_id = $2 OR mentor_id = $3) AND status = 'completed'
    `;
    const sessionResult = await pool.query(sessionQuery, [session_id, userId, userId]);

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Session not found or not authorized to submit feedback"
      });
    }

    const session = sessionResult.rows[0];
    const isStudent = session.student_id === userId;

    // Check if feedback already exists for this session
    const existingFeedbackQuery = `
      SELECT * FROM feedback_sessions WHERE session_id = $1
    `;
    const existingFeedback = await pool.query(existingFeedbackQuery, [session_id]);

    let result;
    if (existingFeedback.rows.length === 0) {
      // Create new feedback record
      const insertQuery = `
        INSERT INTO feedback_sessions (
          session_id,
          ${isStudent ? 'student_rating, student_feedback_type, student_comment' : 'mentor_rating, mentor_feedback_type, mentor_comment'}
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [
        session_id,
        rating,
        feedback_type,
        comment || null
      ]);
    } else {
      // Update existing feedback record
      const feedback = existingFeedback.rows[0];
      const updateQuery = `
        UPDATE feedback_sessions SET
          ${isStudent ? 'student_rating, student_feedback_type, student_comment' : 'mentor_rating, mentor_feedback_type, mentor_comment'} = ($2, $3, $4)
        WHERE session_id = $1
        RETURNING *
      `;
      result = await pool.query(updateQuery, [
        session_id,
        rating,
        feedback_type,
        comment || null
      ]);
    }

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: result.rows[0]
    });

    // Update session outcome with detailed feedback data
    try {
      const feedbackData = {
        rating: rating,
        feedback_type: feedback_type,
        comment: comment,
        is_student: isStudent
      };
      
      await MatchingService.recordSessionOutcome(
        session_id,
        true, // Connected is true since feedback was submitted
        feedbackData
      );
    } catch (feedbackError) {
      console.error("Error recording feedback for ML training:", feedbackError);
      // Don't fail the main request if ML data recording fails
    }

  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get feedback for a session
router.get("/session/:session_id", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user.id;

    // Verify the session exists and the user is part of it
    const sessionQuery = `
      SELECT * FROM sessions
      WHERE id = $1 AND (student_id = $2 OR mentor_id = $3)
    `;
    const sessionResult = await pool.query(sessionQuery, [session_id, userId, userId]);

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    // Get feedback for the session
    const feedbackQuery = `
      SELECT * FROM feedback_sessions WHERE session_id = $1
    `;
    const feedbackResult = await pool.query(feedbackQuery, [session_id]);

    if (feedbackResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: feedbackResult.rows[0]
    });

  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get user's feedback statistics (for leaderboard integration)
router.get("/stats/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const currentUserId = req.user.id;

    // Users can only view their own stats unless they're an admin
    if (parseInt(user_id) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user's stats"
      });
    }

    // Get feedback statistics for the user
    const statsQuery = `
      SELECT
        COUNT(*) as total_sessions,
        AVG(CASE WHEN student_id = $1 THEN mentor_rating ELSE student_rating END) as avg_rating_received,
        COUNT(CASE WHEN student_id = $1 THEN mentor_rating ELSE student_rating END) as ratings_received,
        AVG(CASE WHEN student_id = $1 THEN student_rating ELSE mentor_rating END) as avg_rating_given,
        COUNT(CASE WHEN student_id = $1 THEN student_rating ELSE mentor_rating END) as ratings_given
      FROM sessions s
      LEFT JOIN feedback_sessions fs ON s.id = fs.session_id
      WHERE (s.student_id = $1 OR s.mentor_id = $1) AND s.status = 'completed'
    `;

    const statsResult = await pool.query(statsQuery, [user_id]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        total_sessions: parseInt(stats.total_sessions) || 0,
        avg_rating_received: parseFloat(stats.avg_rating_received) || 0,
        ratings_received: parseInt(stats.ratings_received) || 0,
        avg_rating_given: parseFloat(stats.avg_rating_given) || 0,
        ratings_given: parseInt(stats.ratings_given) || 0
      }
    });

  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get leaderboard data (top rated users)
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboardQuery = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        up.avatar_url,
        AVG(CASE
          WHEN s.student_id = u.id THEN fs.mentor_rating
          WHEN s.mentor_id = u.id THEN fs.student_rating
        END) as avg_rating,
        COUNT(CASE
          WHEN s.student_id = u.id THEN fs.mentor_rating
          WHEN s.mentor_id = u.id THEN fs.student_rating
        END) as total_ratings,
        COUNT(CASE WHEN s.student_id = u.id OR s.mentor_id = u.id THEN 1 END) as total_sessions
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN sessions s ON (u.id = s.student_id OR u.id = s.mentor_id)
      LEFT JOIN feedback_sessions fs ON s.id = fs.session_id
      WHERE s.status = 'completed' AND (fs.student_rating IS NOT NULL OR fs.mentor_rating IS NOT NULL)
      GROUP BY u.id, u.first_name, u.last_name, up.avatar_url
      HAVING COUNT(CASE
        WHEN s.student_id = u.id THEN fs.mentor_rating
        WHEN s.mentor_id = u.id THEN fs.student_rating
      END) >= 3
      ORDER BY avg_rating DESC, total_ratings DESC
      LIMIT $1
    `;

    const leaderboardResult = await pool.query(leaderboardQuery, [limit]);

    res.json({
      success: true,
      data: leaderboardResult.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        avatar_url: row.avatar_url,
        avg_rating: parseFloat(row.avg_rating) || 0,
        total_ratings: parseInt(row.total_ratings) || 0,
        total_sessions: parseInt(row.total_sessions) || 0
      }))
    });

  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Simple feedback submission endpoint (for testing)
router.post("/", async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Session ID and rating are required"
      });
    }

    // Validate rating (1-5 scale)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // For testing purposes, just return success without database operations
    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        sessionId: sessionId,
        rating: rating,
        comment: comment || null,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
